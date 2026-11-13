import { AiError, classifyHttpStatus } from "./errors";
import { sseEvents } from "./sse";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Usage {
  tokensIn: number | null;
  tokensOut: number | null;
  /** custo em dólares informado pela OpenRouter (0 nos modelos gratuitos) */
  costUsd: number | null;
}

export type AiEvent =
  | { type: "text"; text: string }
  | { type: "done"; model: string; fallbackUsed: boolean; usage: Usage | null };

export interface StreamOptions {
  messages: ChatMessage[];
  maxTokens: number;
  /** Lista de modelos em ordem de tentativa. Padrão: variáveis de ambiente. */
  models?: string[];
  /** Cancelamento (ex.: o usuário fechou a página). */
  signal?: AbortSignal;
  /** Tempo máximo para o PRIMEIRO texto aparecer, por modelo (ms). */
  firstTokenMs?: number;
  /** Tempo total máximo somando os modelos (ms). A Vercel corta em 60 s. */
  totalMs?: number;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

/** Modelos configurados por variável de ambiente (principal e reserva), sem repetir. */
export function configuredModels(env = process.env): string[] {
  const list = [env.OPENROUTER_MODEL, env.OPENROUTER_FALLBACK_MODEL].filter((m): m is string => !!m && m.trim() !== "");
  return list.filter((m, i) => list.indexOf(m) === i);
}

interface Chunk {
  error?: { code?: number | string; message?: string };
  choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
}

/**
 * Pede a resposta em streaming. Tenta o modelo principal e, se ele falhar ANTES de produzir texto
 * (sem crédito, limite, fora do ar, lento demais, resposta vazia), tenta o modelo reserva.
 * Se falhar no meio da resposta, o erro é repassado (não dá para "desfalar" texto já enviado).
 */
export async function* streamCompletion(opts: StreamOptions): AsyncGenerator<AiEvent> {
  const apiKey = opts.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AiError("not_configured");
  const models = opts.models ?? configuredModels();
  if (models.length === 0) throw new AiError("not_configured");

  const f = opts.fetchImpl ?? fetch;
  const startedAt = Date.now();
  const totalMs = opts.totalMs ?? 55_000;
  const firstTokenMs = opts.firstTokenMs ?? 30_000;

  let lastError: AiError | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i]!;
    const remaining = totalMs - (Date.now() - startedAt);
    if (remaining < 1500) break;

    const ctrl = new AbortController();
    const signal = opts.signal ? AbortSignal.any([opts.signal, ctrl.signal]) : ctrl.signal;
    const totalTimer = setTimeout(() => ctrl.abort(new AiError("timeout")), remaining);
    let firstTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => ctrl.abort(new AiError("timeout")),
      Math.min(firstTokenMs, remaining),
    );
    let produced = false;
    let usage: Usage | null = null;

    try {
      const res = await f(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          // Identificação do app, recomendada pela OpenRouter
          "HTTP-Referer": process.env.APP_URL ?? "https://lunastrology.vercel.app",
          "X-Title": "Lunastrology",
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          stream: true,
          max_tokens: opts.maxTokens,
          temperature: 0.8,
          // Modelos de raciocínio: pouco "pensar" e sem devolver o raciocínio (atrasa e gasta tokens)
          reasoning: { effort: "low", exclude: true },
          usage: { include: true },
        }),
        signal,
      });

      if (!res.ok || !res.body) {
        throw new AiError(classifyHttpStatus(res.status), `HTTP ${res.status}`);
      }

      for await (const raw of sseEvents(res.body)) {
        const ev = raw as Chunk;
        if (ev.error) {
          const code = Number(ev.error.code);
          throw new AiError(Number.isFinite(code) ? classifyHttpStatus(code) : "unavailable", "erro no meio da resposta", produced);
        }
        const text = ev.choices?.[0]?.delta?.content;
        if (text) {
          if (firstTimer) {
            clearTimeout(firstTimer);
            firstTimer = undefined;
          }
          produced = true;
          yield { type: "text", text };
        }
        if (ev.usage) {
          usage = {
            tokensIn: ev.usage.prompt_tokens ?? null,
            tokensOut: ev.usage.completion_tokens ?? null,
            costUsd: ev.usage.cost ?? null,
          };
        }
      }

      if (!produced) throw new AiError("bad_response", "resposta vazia");
      yield { type: "done", model, fallbackUsed: i > 0, usage };
      return;
    } catch (e) {
      // O usuário cancelou: encerra sem tentar outro modelo.
      if (opts.signal?.aborted) throw e;
      const err =
        e instanceof AiError
          ? e
          : ctrl.signal.aborted && ctrl.signal.reason instanceof AiError
            ? (ctrl.signal.reason as AiError)
            : new AiError("unavailable", e instanceof Error ? e.message : String(e));
      if (produced) throw new AiError(err.kind, err.message, true);
      lastError = err;
      if (!err.retryable) throw err;
    } finally {
      clearTimeout(totalTimer);
      if (firstTimer) clearTimeout(firstTimer);
      ctrl.abort(); // garante que a conexão do modelo que falhou é encerrada
    }
  }

  throw lastError ?? new AiError("unavailable");
}
