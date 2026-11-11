import { computeAspects, type AspectBody } from "./aspects";
import { CALC_VERSION, DEFAULT_HOUSE_SYSTEM, MOON_UNCERTAINTY_DEG } from "./config";
import { astronomyEngineProvider } from "./ephemeris/astronomy-engine";
import type { EphemerisProvider } from "./ephemeris/provider";
import { ascendant, computeHouses, houseOf, midheaven } from "./houses";
import { norm180, norm360 } from "./math";
import { meanLilith, meanNorthNode } from "./points";
import { summarize } from "./summary";
import { julianDay, resolveLocalInstant } from "./time";
import type { BodyId, ChartInput, ChartResult, HouseCusp, PlacedPoint, PlanetId } from "./types";
import { SIGNS, locate } from "./zodiac";

const PLANET_IDS: PlanetId[] = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
];

const HOUR_DAYS = 1 / 24;

/** Velocidade (graus/dia) por diferença central de ±1 hora. */
function speedOf(lonAt: (date: Date) => number, date: Date): number {
  const before = new Date(date.getTime() - 3_600_000);
  const after = new Date(date.getTime() + 3_600_000);
  return norm180(lonAt(after) - lonAt(before)) / (2 * HOUR_DAYS);
}

function place(id: BodyId, longitude: number, speed: number | null, house?: number): PlacedPoint {
  const loc = locate(longitude);
  return {
    id,
    longitude: loc.longitude,
    signIndex: loc.signIndex,
    signName: SIGNS[loc.signIndex]!.name,
    degree: loc.degree,
    minute: loc.minute,
    speed,
    retrograde: speed !== null && speed < 0,
    ...(house !== undefined ? { house } : {}),
  };
}

/**
 * Calcula o mapa astral completo. Função pura: mesma entrada, mesma saída.
 * Para trocar a biblioteca de efemérides, passe outro `provider`.
 */
export function calculateChart(
  input: ChartInput,
  provider: EphemerisProvider = astronomyEngineProvider,
): ChartResult {
  if (input.zodiac && input.zodiac !== "tropical") {
    throw new Error("Só o zodíaco tropical é suportado por enquanto.");
  }
  if (!(input.lat >= -90 && input.lat <= 90) || !(input.lon >= -180 && input.lon <= 180)) {
    throw new Error("Coordenadas inválidas.");
  }
  const timeUnknown = !!input.timeUnknown;
  const localTime = timeUnknown ? "12:00" : input.time;
  if (!localTime) throw new Error("Informe a hora de nascimento ou marque que não a sabe.");

  const warnings: string[] = [];
  const resolved = resolveLocalInstant(input.date, localTime, input.tz, input.ambiguousChoice ?? "first");
  if (resolved.status === "ambiguous") {
    warnings.push(
      "Essa hora local aconteceu duas vezes (fim do horário de verão). Usamos a primeira ocorrência; confira qual vale para você.",
    );
  }
  if (resolved.status === "nonexistent") {
    warnings.push(
      "Essa hora local não existiu naquele dia (o relógio foi adiantado pelo horário de verão). Confira a hora de nascimento.",
    );
  }
  if (timeUnknown) {
    warnings.push(
      `Sem a hora de nascimento, calculamos para o meio-dia. Ascendente, Meio do Céu e casas não são mostrados, e a posição da Lua pode variar até cerca de ${MOON_UNCERTAINTY_DEG}°.`,
    );
  }

  const date = resolved.utc;
  const requested = input.houseSystem ?? DEFAULT_HOUSE_SYSTEM;
  const T = provider.centuriesTT(date);

  // Posições brutas (longitude + velocidade)
  const raw = new Map<BodyId, { lon: number; speed: number | null }>();
  for (const id of PLANET_IDS) {
    raw.set(id, {
      lon: provider.apparentLongitude(id, date),
      speed: speedOf((d) => provider.apparentLongitude(id, d), date),
    });
  }
  const nodeAt = (d: Date) => meanNorthNode(provider.centuriesTT(d));
  const lilithAt = (d: Date) => meanLilith(provider.centuriesTT(d));
  const nodeSpeed = speedOf(nodeAt, date);
  raw.set("northNode", { lon: meanNorthNode(T), speed: nodeSpeed });
  raw.set("southNode", { lon: norm360(meanNorthNode(T) + 180), speed: nodeSpeed });
  raw.set("lilith", { lon: meanLilith(T), speed: speedOf(lilithAt, date) });

  // Ângulos, casas e Parte da Fortuna (só com hora conhecida)
  let cusps: HouseCusp[] | undefined;
  let cuspLongitudes: number[] | undefined;
  let houseSystemUsed: ChartResult["houseSystemUsed"] = null;

  if (!timeUnknown) {
    const eps = provider.trueObliquity(date);
    const ramc = norm360(provider.greenwichApparentSiderealTime(date) * 15 + input.lon);
    const houses = computeHouses(requested, ramc, eps, input.lat);
    houseSystemUsed = houses.used;
    cuspLongitudes = houses.cusps;
    if (houses.fallbackReason === "polar") {
      warnings.push(
        "Em latitudes muito altas (acima de cerca de 66,5°) o sistema de casas escolhido não existe; usamos Casas Inteiras.",
      );
    }
    const asc = ascendant(ramc, eps, input.lat);
    const mc = midheaven(ramc, eps);
    raw.set("asc", { lon: asc, speed: null });
    raw.set("mc", { lon: mc, speed: null });

    const sun = raw.get("sun")!.lon;
    const moon = raw.get("moon")!.lon;
    const day = norm360(sun - asc) >= 180; // Sol acima do horizonte
    raw.set("partOfFortune", { lon: norm360(day ? asc + moon - sun : asc + sun - moon), speed: null });

    cusps = houses.cusps.map((c, i) => {
      const loc = locate(c);
      return {
        house: i + 1,
        longitude: loc.longitude,
        signIndex: loc.signIndex,
        signName: SIGNS[loc.signIndex]!.name,
        degree: loc.degree,
        minute: loc.minute,
      };
    });
  }

  const bodies: ChartResult["bodies"] = {};
  for (const [id, r] of raw) {
    const hasHouse = cuspLongitudes && id !== "asc" && id !== "mc";
    bodies[id] = place(id, r.lon, r.speed, hasHouse ? houseOf(r.lon, cuspLongitudes!) : undefined);
  }

  // Aspectos: planetas, Nodo Norte, Lilith e (com hora) ASC/MC
  const aspectIds: BodyId[] = [...PLANET_IDS, "northNode", "lilith", ...(timeUnknown ? [] : (["asc", "mc"] as BodyId[]))];
  const aspectBodies: AspectBody[] = aspectIds.map((id) => ({
    id,
    longitude: raw.get(id)!.lon,
    speed: id === "asc" || id === "mc" ? null : raw.get(id)!.speed,
  }));

  return {
    calcVersion: CALC_VERSION,
    input,
    instant: {
      utcIso: date.toISOString(),
      jdUt: julianDay(date),
      offsetMinutes: resolved.offsetMinutes,
      status: resolved.status,
    },
    houseSystemRequested: requested,
    houseSystemUsed,
    warnings,
    bodies,
    ...(cusps ? { cusps } : {}),
    aspects: computeAspects(aspectBodies),
    summary: summarize(bodies, !timeUnknown),
  };
}
