import { DateTime } from "luxon";

export interface ResolvedInstant {
  utc: Date;
  /** deslocamento do fuso (minutos, positivo a leste de UTC) valendo naquele instante */
  offsetMinutes: number;
  status: "ok" | "ambiguous" | "nonexistent";
  /** instantes UTC possíveis quando há ambiguidade (ordem cronológica) */
  alternatives: Date[];
}

const MS_DAY = 86_400_000;
const FMT = "yyyy-MM-dd'T'HH:mm";

/**
 * Converte data/hora LOCAIS de um lugar em UTC, usando as regras históricas do fuso (banco IANA).
 * Detecta os dois casos perigosos do horário de verão:
 *  - hora AMBÍGUA (o relógio volta; a mesma hora local acontece duas vezes)
 *  - hora INEXISTENTE (o relógio adianta; aquela hora local nunca existiu)
 */
export function resolveLocalInstant(
  date: string,
  time: string,
  tz: string,
  choice: "first" | "second" = "first",
): ResolvedInstant {
  if (!DateTime.fromObject({}, { zone: tz }).isValid) {
    throw new Error(`Fuso horário inválido: ${tz}`);
  }
  const naive = DateTime.fromISO(`${date}T${time}`, { zone: "utc" });
  if (!naive.isValid) throw new Error(`Data/hora inválida: ${date} ${time}`);
  const naiveMs = naive.toMillis();

  // Possíveis deslocamentos: o que vale um dia antes e um dia depois.
  const offsets = new Set<number>([
    DateTime.fromMillis(naiveMs - MS_DAY, { zone: tz }).offset,
    DateTime.fromMillis(naiveMs + MS_DAY, { zone: tz }).offset,
  ]);

  const valid: { utcMs: number; offset: number }[] = [];
  for (const offset of offsets) {
    const utcMs = naiveMs - offset * 60_000;
    const back = DateTime.fromMillis(utcMs, { zone: tz });
    // O candidato só vale se, voltando para o fuso, a hora local é a mesma que a pessoa informou.
    if (back.toFormat(FMT) === naive.toFormat(FMT)) valid.push({ utcMs, offset });
  }
  valid.sort((x, y) => x.utcMs - y.utcMs);

  if (valid.length === 0) {
    // Hora que nunca existiu: usa o deslocamento de antes da virada.
    const before = DateTime.fromMillis(naiveMs - MS_DAY, { zone: tz }).offset;
    return {
      utc: new Date(naiveMs - before * 60_000),
      offsetMinutes: before,
      status: "nonexistent",
      alternatives: [],
    };
  }
  if (valid.length === 1) {
    const only = valid[0]!;
    return { utc: new Date(only.utcMs), offsetMinutes: only.offset, status: "ok", alternatives: [] };
  }
  const chosen = choice === "second" ? valid[1]! : valid[0]!;
  return {
    utc: new Date(chosen.utcMs),
    offsetMinutes: chosen.offset,
    status: "ambiguous",
    alternatives: valid.map((v) => new Date(v.utcMs)),
  };
}

/** Dia Juliano (UT) de um instante. */
export function julianDay(date: Date): number {
  return date.getTime() / MS_DAY + 2440587.5;
}
