const DONE = Symbol("done");

/** Interpreta uma linha de Server-Sent Events. Devolve o JSON, DONE, ou undefined para ignorar. */
function parseLine(raw: string): unknown | typeof DONE | undefined {
  const line = raw.trim();
  // Linhas vazias e comentários (": OPENROUTER PROCESSING") são só para manter a conexão viva.
  if (line === "" || line.startsWith(":")) return undefined;
  if (!line.startsWith("data:")) return undefined;
  const payload = line.slice(5).trim();
  if (payload === "[DONE]") return DONE;
  try {
    return JSON.parse(payload);
  } catch {
    return undefined; // linha quebrada: ignora em vez de derrubar a resposta
  }
}

/**
 * Lê um corpo SSE e devolve cada evento JSON. Aguenta pedaços cortados no meio de uma linha
 * (a rede entrega os bytes em blocos arbitrários).
 */
export async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        const ev = parseLine(line);
        if (ev === DONE) return;
        if (ev !== undefined) yield ev;
      }
    }
    const last = parseLine(buffer);
    if (last !== undefined && last !== DONE) yield last;
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* já encerrado */
    }
  }
}
