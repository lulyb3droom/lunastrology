import { ELEMENTS, MODALITIES, SIGNS } from "./zodiac";
import type { ChartSummary, Element, Modality, PlacedPoint, PlanetId } from "./types";

const PLANETS: PlanetId[] = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
];

function dominant<K extends string>(counts: Record<K, number>, order: readonly K[]): K {
  // Em caso de empate, vale a ordem tradicional (fogo, terra, ar, água / cardinal, fixo, mutável).
  return order.reduce((best, k) => (counts[k] > counts[best] ? k : best), order[0]!);
}

/** Elementos e modalidades contam os 10 planetas (Sol a Plutão). */
export function summarize(bodies: Partial<Record<string, PlacedPoint>>, hasAsc: boolean): ChartSummary {
  const elements = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>;
  const modalities = Object.fromEntries(MODALITIES.map((m) => [m, 0])) as Record<Modality, number>;

  for (const id of PLANETS) {
    const p = bodies[id]!;
    const sign = SIGNS[p.signIndex]!;
    elements[sign.element] += 1;
    modalities[sign.modality] += 1;
  }

  const asc = hasAsc ? (bodies["asc"] ?? null) : null;
  const ascSign = asc ? SIGNS[asc.signIndex]! : null;

  return {
    elements,
    modalities,
    dominantElement: dominant(elements, ELEMENTS),
    dominantModality: dominant(modalities, MODALITIES),
    chartRuler: ascSign ? { traditional: ascSign.rulerTraditional, modern: ascSign.rulerModern } : null,
    bigThree: { sun: bodies["sun"]!, moon: bodies["moon"]!, asc },
  };
}
