import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getVisitorId, hashVisitor } from "@/lib/charts/visitor";
import { drawSpread, type DrawnCard } from "./draw";
import type { SpreadId } from "./spreads";

export interface StoredReading {
  id: string;
  spread: SpreadId;
  question: string | null;
  cards: DrawnCard[];
  interpretation: string | null;
  createdAt: Date;
}

export interface SavedInterpretation {
  text: string;
  model: string;
  usage: { tokensIn: number | null; tokensOut: number | null; costUsd: number | null } | null;
}

/** Guarda a interpretação gerada (uma vez só: depois é reaproveitada, sem gastar IA). */
export async function saveReadingInterpretation(id: string, r: SavedInterpretation): Promise<void> {
  await getDb()
    .update(schema.tarotReadings)
    .set({
      interpretation: r.text,
      model: r.model,
      tokensIn: r.usage?.tokensIn ?? null,
      tokensOut: r.usage?.tokensOut ?? null,
      costUsd: r.usage?.costUsd != null ? String(r.usage.costUsd) : null,
    })
    .where(eq(schema.tarotReadings.id, id));
}

/** Sorteia (no servidor) e grava uma tiragem. Devolve o id. */
export async function createReading(spread: SpreadId, question: string | null, visitorId: string): Promise<string> {
  const cards = drawSpread(spread);
  const [row] = await getDb()
    .insert(schema.tarotReadings)
    .values({ spread, question, cards, visitorHash: hashVisitor(visitorId) })
    .returning({ id: schema.tarotReadings.id });
  return row!.id;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Busca uma tiragem, mas SÓ se pertencer a este visitante (cookie). */
export async function getReadingForVisitor(id: string): Promise<StoredReading | null> {
  if (!UUID.test(id)) return null;
  const visitor = await getVisitorId();
  if (!visitor) return null;
  const rows = await getDb()
    .select()
    .from(schema.tarotReadings)
    .where(and(eq(schema.tarotReadings.id, id), eq(schema.tarotReadings.visitorHash, hashVisitor(visitor))))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    spread: r.spread as SpreadId,
    question: r.question,
    cards: r.cards as DrawnCard[],
    interpretation: r.interpretation,
    createdAt: r.createdAt,
  };
}
