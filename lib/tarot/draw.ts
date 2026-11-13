import { randomInt } from "node:crypto";
import { TAROT_DECK } from "@/data/tarot/cartas";
import { getSpread, type SpreadId } from "./spreads";

/** Fonte de aleatoriedade. Em produção é o gerador criptográfico do sistema; em testes dá para injetar um fixo. */
export interface Rng {
  /** inteiro uniforme em [0, max) */
  int(max: number): number;
}

export const cryptoRng: Rng = { int: (max) => randomInt(max) };

export interface DrawnCard {
  cardId: string;
  /** índice da posição na tiragem (0 = primeira) */
  position: number;
  reversed: boolean;
}

/** Embaralhamento Fisher–Yates (sem viés). Não altera o array original. */
export function shuffle<T>(items: readonly T[], rng: Rng = cryptoRng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Chance de carta invertida vinda da configuração (0 a 1; padrão 0,3). */
export function reversedChanceFromEnv(value = process.env.TAROT_REVERSED_CHANCE): number {
  const n = value === undefined || value === "" ? 0.3 : Number(value);
  if (!Number.isFinite(n)) return 0.3;
  return Math.min(1, Math.max(0, n));
}

const PRECISION = 1_000_000;

/**
 * Sorteia as cartas de uma tiragem: embaralha o baralho de 78 e pega as primeiras N,
 * cada uma com a chance configurada de sair invertida. Sem repetição.
 */
export function drawSpread(
  spreadId: SpreadId,
  options: { reversedChance?: number; rng?: Rng } = {},
): DrawnCard[] {
  const spread = getSpread(spreadId);
  if (!spread) throw new Error(`Tiragem desconhecida: ${spreadId}`);
  const rng = options.rng ?? cryptoRng;
  const chance = options.reversedChance ?? reversedChanceFromEnv();

  const deck = shuffle(
    TAROT_DECK.map((c) => c.id),
    rng,
  );
  return spread.positions.map((_, position) => ({
    cardId: deck[position]!,
    position,
    reversed: rng.int(PRECISION) < Math.round(chance * PRECISION),
  }));
}
