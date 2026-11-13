import { cookies } from "next/headers";
import { getReadingForVisitor, type StoredReading } from "./repo";

export const DAILY_COOKIE = "luna_daily";

/** Data de hoje (AAAA-MM-DD) no horário de Brasília: o "dia" da carta do dia. */
export function todayInBrazil(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

/** Cookie no formato "AAAA-MM-DD:uuid". */
export function parseDailyCookie(value: string | undefined): { date: string; readingId: string } | null {
  const m = value?.match(/^(\d{4}-\d{2}-\d{2}):([0-9a-f-]{36})$/i);
  return m ? { date: m[1]!, readingId: m[2]! } : null;
}

/** A carta do dia que este visitante já tirou hoje (se houver). */
export async function getTodaysReading(): Promise<StoredReading | null> {
  const jar = await cookies();
  const daily = parseDailyCookie(jar.get(DAILY_COOKIE)?.value);
  if (!daily || daily.date !== todayInBrazil()) return null;
  const reading = await getReadingForVisitor(daily.readingId);
  return reading && reading.spread === "carta-do-dia" ? reading : null;
}
