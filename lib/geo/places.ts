import tzlookup from "tz-lookup";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface Place {
  displayName: string;
  lat: number;
  lon: number;
  /** nome IANA do fuso, ex.: America/Sao_Paulo */
  tz: string;
}

interface NominatimItem {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
}

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

/** Normaliza a busca para servir de chave do cache (minúsculas, sem acento, espaços únicos). */
export function normalizeQuery(q: string): string {
  return q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Fuso IANA de uma coordenada. */
export function timezoneFor(lat: number, lon: number): string {
  return tzlookup(lat, lon);
}

/** "Goiânia, Goiás, Brasil" a partir do endereço estruturado do Nominatim. */
export function buildDisplayName(item: NominatimItem): string {
  const a = item.address ?? {};
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.hamlet ?? item.name;
  const parts = [city, a.state ?? a.region, a.country].filter((p): p is string => !!p);
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length > 0 ? unique.join(", ") : (item.display_name ?? "Local sem nome");
}

/** Converte a resposta do Nominatim em lugares (sem duplicados, máx. 5). */
export function parseNominatim(items: NominatimItem[]): Place[] {
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const item of items) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    let tz: string;
    try {
      tz = timezoneFor(lat, lon);
    } catch {
      continue; // coordenada sem fuso (ex.: oceano)
    }
    const displayName = buildDisplayName(item);
    if (seen.has(displayName)) continue;
    seen.add(displayName);
    places.push({ displayName, lat: +lat.toFixed(4), lon: +lon.toFixed(4), tz });
    if (places.length === 5) break;
  }
  return places;
}

// A política do Nominatim pede no máximo 1 requisição por segundo.
// Isto serializa as chamadas dentro de uma mesma instância do servidor.
let lastCall = Promise.resolve();
let lastAt = 0;
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = lastCall.then(async () => {
    const wait = Math.max(0, lastAt + 1100 - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastAt = Date.now();
    return fn();
  });
  lastCall = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export class GeocodeError extends Error {}

async function fetchNominatim(q: string): Promise<Place[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", "pt-BR");
  url.searchParams.set("featureType", "settlement");

  const res = await throttled(() =>
    fetch(url, {
      headers: { "User-Agent": process.env.GEOCODER_USER_AGENT ?? "lunastrology/0.1 (projeto pessoal)" },
      signal: AbortSignal.timeout(7000),
    }),
  );
  if (!res.ok) throw new GeocodeError(`Nominatim respondeu ${res.status}`);
  return parseNominatim((await res.json()) as NominatimItem[]);
}

/** Busca cidades pelo nome, usando o cache do banco antes de chamar o Nominatim. */
export async function searchPlaces(rawQuery: string, guard?: () => Promise<void>): Promise<Place[]> {
  const key = normalizeQuery(rawQuery);
  if (key.length < 3) return [];

  const db = getDb();
  const cached = await db
    .select({ results: schema.geocodeCache.results })
    .from(schema.geocodeCache)
    .where(eq(schema.geocodeCache.queryNorm, key))
    .limit(1);
  if (cached[0]?.results) return cached[0].results as Place[];

  // Só chega aqui quando NÃO está no cache: é a chamada que conta para o limite diário.
  await guard?.();
  const places = await fetchNominatim(key);
  if (places.length > 0) {
    const first = places[0]!;
    await db
      .insert(schema.geocodeCache)
      .values({
        queryNorm: key,
        lat: first.lat,
        lon: first.lon,
        tz: first.tz,
        displayName: first.displayName,
        results: places,
      })
      .onConflictDoNothing();
  }
  return places;
}
