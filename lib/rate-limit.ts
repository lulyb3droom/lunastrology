import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { todayInBrazil } from "@/lib/tarot/daily";

export interface LimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

/** Identifica quem faz o pedido SEM guardar o IP em claro: só um hash (LGPD: coletar o mínimo). */
export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || request.headers.get("x-real-ip") || "local";
  return createHash("sha256")
    .update(ip + (process.env.RATE_LIMIT_SALT ?? ""))
    .digest("hex")
    .slice(0, 32);
}

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Limites diários (por tipo de ação). Configuráveis por variável de ambiente. */
export const LIMITS = {
  /** interpretações por IA: visitante / logado (cada tipo — tarot e mapa — tem o seu contador) */
  aiGuest: () => envInt("RATE_LIMIT_GUEST_PER_DAY", 3),
  aiUser: () => envInt("RATE_LIMIT_USER_PER_DAY", 10),
  /** ações baratas, só para impedir abuso */
  createChart: () => envInt("RATE_LIMIT_CHARTS_PER_DAY", 40),
  drawTarot: () => envInt("RATE_LIMIT_DRAWS_PER_DAY", 40),
  geocode: () => envInt("RATE_LIMIT_GEOCODE_PER_DAY", 80),
} as const;

/**
 * Conta mais uma ação e diz se ainda está dentro do limite do dia (fuso de Brasília).
 * Usa um contador no Postgres, atômico, que funciona em serverless sem serviço extra.
 */
export async function hit(action: string, who: string, limit: number): Promise<LimitResult> {
  const key = `${action}:${who}`;
  const day = todayInBrazil();
  const [row] = await getDb()
    .insert(schema.rateLimits)
    .values({ key, day, count: 1 })
    .onConflictDoUpdate({
      target: [schema.rateLimits.key, schema.rateLimits.day],
      set: { count: sql`${schema.rateLimits.count} + 1` },
    })
    .returning({ count: schema.rateLimits.count });
  const count = row!.count;
  return { allowed: count <= limit, count, limit };
}

/** Devolve uma ação ao contador (usado quando a IA falha: a pessoa não deve perder a tentativa). */
export async function refund(action: string, who: string): Promise<void> {
  await getDb()
    .update(schema.rateLimits)
    .set({ count: sql`greatest(${schema.rateLimits.count} - 1, 0)` })
    .where(and(eq(schema.rateLimits.key, `${action}:${who}`), eq(schema.rateLimits.day, todayInBrazil())));
}

export const LIMIT_MESSAGE = (n: number) =>
  `Você atingiu o limite de ${n} ${n === 1 ? "interpretação" : "interpretações"} por IA de hoje. Volte amanhã, ou crie uma conta para ter um limite maior.`;

export const BUSY_MESSAGE = "Muitos pedidos hoje a partir da sua conexão. Tente de novo amanhã.";
