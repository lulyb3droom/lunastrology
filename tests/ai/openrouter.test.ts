import { describe, expect, it } from "vitest";
import { AiError } from "@/lib/ai/errors";
import { configuredModels, reasoningParam, streamCompletion, type AiEvent } from "@/lib/ai/openrouter";
import { sseEvents } from "@/lib/ai/sse";

const enc = new TextEncoder();

/** Cria uma resposta de streaming a partir de pedaços de texto (com o intervalo escolhido entre eles). */
function sseResponse(chunks: string[], opts: { status?: number; delayMs?: number } = {}): Response {
  const body = new ReadableStream<Uint8Array>({
    async start(c) {
      for (const ch of chunks) {
        if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
        c.enqueue(enc.encode(ch));
      }
      c.close();
    },
  });
  return new Response(body, { status: opts.status ?? 200, headers: { "Content-Type": "text/event-stream" } });
}

const content = (t: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`;
const usage = (i: number, o: number, cost = 0) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: "" } }], usage: { prompt_tokens: i, completion_tokens: o, cost } })}\n\n`;
const reasoning = `data: ${JSON.stringify({ choices: [{ delta: { reasoning: "pensando..." } }] })}\n\n`;

function jsonError(status: number, message = "erro"): Response {
  return new Response(JSON.stringify({ error: { code: status, message } }), { status });
}

/** fetch falso: devolve as respostas em ordem e guarda as chamadas. Respeita o cancelamento (signal). */
function fakeFetch(plan: (Response | ((signal: AbortSignal) => Promise<Response>))[]) {
  const calls: { model: string; headers: Record<string, string>; body: Record<string, unknown> }[] = [];
  const f = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    calls.push({ model: body.model, headers: init.headers as Record<string, string>, body });
    const step = plan[calls.length - 1] ?? jsonError(503);
    return typeof step === "function" ? step(init.signal as AbortSignal) : step;
  }) as unknown as typeof fetch;
  return { f, calls };
}

async function collect(gen: AsyncGenerator<AiEvent>) {
  const out: AiEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
}
const texts = (ev: AiEvent[]) => ev.flatMap((e) => (e.type === "text" ? [e.text] : [])).join("");

const base = { messages: [{ role: "user" as const, content: "oi" }], maxTokens: 100, apiKey: "chave-de-teste", models: ["principal", "reserva"] };

describe("leitura de SSE", () => {
  it("junta pedaços cortados no meio da linha, ignora comentários e para no [DONE]", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        const full = `: OPENROUTER PROCESSING\n\n${content("Olá")}${content(" mundo")}data: [DONE]\n\n${content("DEPOIS")}`;
        // corta em pedaços de 7 bytes, partindo linhas ao meio
        for (let i = 0; i < full.length; i += 7) c.enqueue(enc.encode(full.slice(i, i + 7)));
        c.close();
      },
    });
    const got: string[] = [];
    for await (const ev of sseEvents(body)) got.push((ev as { choices: { delta: { content: string } }[] }).choices[0]!.delta.content);
    expect(got).toEqual(["Olá", " mundo"]);
  });

  it("ignora linhas quebradas sem derrubar a resposta", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode(`data: {quebrado\n\n${content("ok")}`));
        c.close();
      },
    });
    const out: unknown[] = [];
    for await (const ev of sseEvents(body)) out.push(ev);
    expect(out).toHaveLength(1);
  });
});

describe("streamCompletion", () => {
  it("devolve o texto aos poucos, ignora o raciocínio e informa tokens e custo", async () => {
    const { f, calls } = fakeFetch([sseResponse([reasoning, content("Olá, "), content("viajante."), usage(120, 30, 0.0012), "data: [DONE]\n\n"])]);
    const ev = await collect(streamCompletion({ ...base, fetchImpl: f }));
    expect(texts(ev)).toBe("Olá, viajante.");
    const done = ev.at(-1)!;
    expect(done).toMatchObject({ type: "done", model: "principal", fallbackUsed: false });
    expect((done as Extract<AiEvent, { type: "done" }>).usage).toEqual({ tokensIn: 120, tokensOut: 30, costUsd: 0.0012 });
    expect(calls).toHaveLength(1);
  });

  it("envia os cabeçalhos de identificação e os parâmetros pedidos (streaming, max_tokens, raciocínio desligado)", async () => {
    const { f, calls } = fakeFetch([sseResponse([content("x"), "data: [DONE]\n\n"])]);
    await collect(streamCompletion({ ...base, fetchImpl: f }));
    const c = calls[0]!;
    expect(c.headers["Authorization"]).toBe("Bearer chave-de-teste");
    expect(c.headers["X-Title"]).toBe("Lunastrology");
    expect(c.headers["HTTP-Referer"]).toMatch(/^https?:\/\//);
    expect(c.body).toMatchObject({ stream: true, max_tokens: 100, reasoning: { enabled: false } });
  });

  it.each([
    ["sem crédito (402)", 402],
    ["limite de uso (429)", 429],
    ["modelo fora do ar (503)", 503],
    ["erro do servidor (502)", 502],
  ])("tenta o modelo reserva quando o principal falha: %s", async (_nome, status) => {
    const { f, calls } = fakeFetch([jsonError(status), sseResponse([content("do reserva"), "data: [DONE]\n\n"])]);
    const ev = await collect(streamCompletion({ ...base, fetchImpl: f }));
    expect(texts(ev)).toBe("do reserva");
    expect(ev.at(-1)).toMatchObject({ type: "done", model: "reserva", fallbackUsed: true });
    expect(calls.map((c) => c.model)).toEqual(["principal", "reserva"]);
  });

  it("tenta o reserva quando o principal responde 200 mas só com erro, ou vazio", async () => {
    const erroNoStream = `data: ${JSON.stringify({ error: { code: 502, message: "x" }, choices: [{ finish_reason: "error" }] })}\n\n`;
    const a = fakeFetch([sseResponse([erroNoStream]), sseResponse([content("ok"), "data: [DONE]\n\n"])]);
    expect(texts(await collect(streamCompletion({ ...base, fetchImpl: a.f })))).toBe("ok");
    const b = fakeFetch([sseResponse(["data: [DONE]\n\n"]), sseResponse([content("ok2"), "data: [DONE]\n\n"])]);
    expect(texts(await collect(streamCompletion({ ...base, fetchImpl: b.f })))).toBe("ok2");
  });

  it("tenta o reserva quando o principal demora demais para o primeiro texto", async () => {
    const travado = (signal: AbortSignal) =>
      new Promise<Response>((_res, rej) => signal.addEventListener("abort", () => rej(signal.reason)));
    const { f, calls } = fakeFetch([travado, sseResponse([content("rápido"), "data: [DONE]\n\n"])]);
    const ev = await collect(streamCompletion({ ...base, fetchImpl: f, firstTokenMs: 40 }));
    expect(texts(ev)).toBe("rápido");
    expect(calls).toHaveLength(2);
  });

  it("só raciocínio, sem texto, também conta como lento", async () => {
    const soRaciocinio = async (signal: AbortSignal) => {
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(enc.encode(reasoning));
          signal.addEventListener("abort", () => c.error(signal.reason));
        },
      });
      return new Response(body, { status: 200 });
    };
    const { f } = fakeFetch([soRaciocinio, sseResponse([content("ok"), "data: [DONE]\n\n"])]);
    const ev = await collect(streamCompletion({ ...base, fetchImpl: f, firstTokenMs: 40 }));
    expect(texts(ev)).toBe("ok");
  });

  it("se os dois modelos falham, o erro vem com mensagem amigável (e o último tipo)", async () => {
    const { f } = fakeFetch([jsonError(402), jsonError(429)]);
    await expect(collect(streamCompletion({ ...base, fetchImpl: f }))).rejects.toMatchObject({
      kind: "rate_limited",
      userMessage: expect.stringMatching(/disputado/),
    });
  });

  it("chave inválida (401) não tenta o reserva: o problema é de configuração", async () => {
    const { f, calls } = fakeFetch([jsonError(401), sseResponse([content("não deveria"), "data: [DONE]\n\n"])]);
    await expect(collect(streamCompletion({ ...base, fetchImpl: f }))).rejects.toMatchObject({ kind: "auth" });
    expect(calls).toHaveLength(1);
  });

  it("falha no MEIO da resposta não troca de modelo: repassa o erro (o texto já foi enviado)", async () => {
    const meio = `data: ${JSON.stringify({ error: { code: 503, message: "caiu" }, choices: [{ finish_reason: "error" }] })}\n\n`;
    const { f, calls } = fakeFetch([sseResponse([content("começo "), meio]), sseResponse([content("não")])]);
    const gen = streamCompletion({ ...base, fetchImpl: f });
    const got: string[] = [];
    await expect(
      (async () => {
        for await (const e of gen) if (e.type === "text") got.push(e.text);
      })(),
    ).rejects.toMatchObject({ producedText: true });
    expect(got).toEqual(["começo "]);
    expect(calls).toHaveLength(1);
  });

  it("sem chave configurada: erro claro, sem chamar a rede", async () => {
    const { f, calls } = fakeFetch([]);
    await expect(collect(streamCompletion({ ...base, apiKey: "", fetchImpl: f }))).rejects.toBeInstanceOf(AiError);
    expect(calls).toHaveLength(0);
  });

  it("cancelamento pelo usuário para tudo, sem tentar o reserva", async () => {
    const ctrl = new AbortController();
    const { f, calls } = fakeFetch([
      (signal) =>
        new Promise<Response>((_res, rej) => {
          signal.addEventListener("abort", () => rej(signal.reason));
          setTimeout(() => ctrl.abort(), 10);
        }),
      sseResponse([content("não deveria")]),
    ]);
    await expect(collect(streamCompletion({ ...base, fetchImpl: f, signal: ctrl.signal }))).rejects.toBeDefined();
    expect(calls).toHaveLength(1);
  });
});

describe("raciocínio dos modelos", () => {
  it("fica desligado por padrão e pode ser ligado por variável de ambiente", () => {
    expect(reasoningParam({} as never)).toEqual({ reasoning: { enabled: false } });
    expect(reasoningParam({ OPENROUTER_REASONING: "off" } as never)).toEqual({ reasoning: { enabled: false } });
    expect(reasoningParam({ OPENROUTER_REASONING: "low" } as never)).toEqual({ reasoning: { effort: "low", exclude: true } });
    expect(reasoningParam({ OPENROUTER_REASONING: "HIGH" } as never)).toEqual({ reasoning: { effort: "high", exclude: true } });
    expect(reasoningParam({ OPENROUTER_REASONING: "lixo" } as never)).toEqual({ reasoning: { enabled: false } });
  });
});

describe("modelos configurados", () => {
  it("lê principal e reserva das variáveis de ambiente, sem repetir nem aceitar vazios", () => {
    expect(configuredModels({ OPENROUTER_MODEL: "a:free", OPENROUTER_FALLBACK_MODEL: "b:free" } as never)).toEqual(["a:free", "b:free"]);
    expect(configuredModels({ OPENROUTER_MODEL: "a", OPENROUTER_FALLBACK_MODEL: "a" } as never)).toEqual(["a"]);
    expect(configuredModels({ OPENROUTER_MODEL: " ", OPENROUTER_FALLBACK_MODEL: "b" } as never)).toEqual(["b"]);
    expect(configuredModels({} as never)).toEqual([]);
  });
});
