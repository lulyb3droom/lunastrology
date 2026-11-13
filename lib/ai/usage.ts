import { getDb, schema } from "@/lib/db";
import type { Usage } from "./openrouter";

export type UsageStatus = "ok" | "reserva" | "erro";

/** Registra cada chamada de IA (para acompanhar uso e custo na página de admin). Nunca derruba a resposta. */
export async function recordUsage(entry: {
  kind: "tarot" | "mapa";
  model: string;
  status: UsageStatus;
  usage: Usage | null;
}): Promise<void> {
  try {
    await getDb().insert(schema.aiUsage).values({
      kind: entry.kind,
      model: entry.model,
      status: entry.status,
      tokensIn: entry.usage?.tokensIn ?? null,
      tokensOut: entry.usage?.tokensOut ?? null,
      costUsd: entry.usage?.costUsd != null ? String(entry.usage.costUsd) : null,
    });
  } catch (e) {
    console.error("ai_usage", e);
  }
}
