import { LIMITS, LIMIT_MESSAGE, clientKey, hit, refund } from "@/lib/rate-limit";
import { AiError } from "./errors";
import { configuredModels, streamCompletion, type AiEvent, type ChatMessage, type Usage } from "./openrouter";
import { recordUsage } from "./usage";

interface Options {
  request: Request;
  kind: "tarot" | "mapa";
  /** Interpretação já salva: se existir, é devolvida sem gastar IA nem limite. */
  stored: string | null;
  buildMessages: () => ChatMessage[];
  maxTokens: number;
  save: (result: { text: string; model: string; usage: Usage | null }) => Promise<void>;
}

const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Accel-Buffering": "no",
};

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Devolve a interpretação em streaming (texto aparecendo aos poucos).
 * - Já existe salva? Devolve a salva (não gasta IA).
 * - Respeita o limite diário; se a IA falhar, devolve a tentativa ao contador.
 * - Erros ANTES do primeiro texto viram uma resposta JSON com status e mensagem amigável.
 */
export async function interpretResponse(o: Options): Promise<Response> {
  if (o.stored) return new Response(o.stored, { headers: { ...TEXT_HEADERS, "X-Interpretation-Cached": "1" } });

  const action = `ai-${o.kind}`;
  const who = clientKey(o.request);
  const limit = LIMITS.aiGuest();
  const verdict = await hit(action, who, limit);
  if (!verdict.allowed) return json({ error: LIMIT_MESSAGE(limit) }, 429);

  const gen = streamCompletion({ messages: o.buildMessages(), maxTokens: o.maxTokens, signal: o.request.signal });

  // Espera o primeiro texto: se a IA falhar aqui, ainda dá para responder com um erro de verdade.
  let first: IteratorResult<AiEvent>;
  try {
    first = await gen.next();
    if (first.done || first.value.type !== "text") throw new AiError("bad_response");
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("unavailable", e instanceof Error ? e.message : String(e));
    console.error("ia", o.kind, err.kind, err.message);
    await refund(action, who);
    await recordUsage({ kind: o.kind, model: configuredModels()[0] ?? "?", status: "erro", usage: null });
    return json({ error: err.userMessage, kind: err.kind }, err.httpStatus);
  }

  const encoder = new TextEncoder();
  let text = first.value.text;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(text));
      try {
        let done: Extract<AiEvent, { type: "done" }> | null = null;
        for await (const ev of gen) {
          if (ev.type === "text") {
            text += ev.text;
            controller.enqueue(encoder.encode(ev.text));
          } else {
            done = ev;
          }
        }
        if (done) {
          await o.save({ text, model: done.model, usage: done.usage });
          await recordUsage({ kind: o.kind, model: done.model, status: done.fallbackUsed ? "reserva" : "ok", usage: done.usage });
        }
        controller.close();
      } catch (e) {
        // Caiu no meio: não salvamos texto incompleto e devolvemos a tentativa.
        console.error("ia (meio da resposta)", o.kind, e instanceof Error ? e.message : e);
        await refund(action, who).catch(() => undefined);
        await recordUsage({ kind: o.kind, model: configuredModels()[0] ?? "?", status: "erro", usage: null });
        controller.error(e);
      }
    },
    async cancel() {
      // A pessoa fechou a página: para de pedir texto à IA.
      await gen.return(undefined);
    },
  });

  return new Response(stream, { headers: TEXT_HEADERS });
}
