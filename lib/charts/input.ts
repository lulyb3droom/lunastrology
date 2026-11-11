import type { ChartInput, HouseSystem } from "@/lib/astro";
import { timezoneFor } from "@/lib/geo/places";
import { HOUSE_SYSTEMS } from "./house-systems";

export interface BirthFormData {
  /** nome ou rótulo (opcional) */
  name: string | null;
  placeName: string;
  chart: ChartInput;
}

export type ParseResult =
  | { ok: true; data: BirthFormData }
  | { ok: false; errors: Record<string, string> };

const MIN_DATE = "1800-01-01";

/** Hoje, em AAAA-MM-DD (UTC; aceita nascimentos de "hoje" em qualquer fuso). */
function todayPlusOne(): string {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

function isRealDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * Valida e normaliza os dados do formulário (SEMPRE no servidor; nunca confiamos no navegador).
 * O fuso horário é recalculado a partir das coordenadas.
 */
export function parseBirthInput(raw: unknown): ParseResult {
  const errors: Record<string, string> = {};
  const r = (raw ?? {}) as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim().slice(0, 60) : "";

  const date = typeof r.date === "string" ? r.date : "";
  if (!isRealDate(date)) errors.date = "Informe uma data de nascimento válida.";
  else if (date < MIN_DATE) errors.date = "Datas anteriores a 1800 não são suportadas.";
  else if (date > todayPlusOne()) errors.date = "A data de nascimento não pode estar no futuro.";

  const timeUnknown = r.timeUnknown === true;
  const time = typeof r.time === "string" ? r.time : "";
  if (!timeUnknown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    errors.time = "Informe a hora (ou marque que não sabe).";
  }

  const placeName = typeof r.placeName === "string" ? r.placeName.trim().slice(0, 160) : "";
  const lat = Number(r.lat);
  const lon = Number(r.lon);
  let tz = "";
  if (!placeName || !Number.isFinite(lat) || !Number.isFinite(lon) || r.lat === null || r.lon === null) {
    errors.place = "Escolha a cidade de nascimento na lista.";
  } else if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    errors.place = "Coordenadas inválidas.";
  } else {
    try {
      tz = timezoneFor(lat, lon);
    } catch {
      errors.place = "Não foi possível descobrir o fuso horário deste local.";
    }
  }

  const houseSystem = (typeof r.houseSystem === "string" ? r.houseSystem : "placidus") as HouseSystem;
  if (!HOUSE_SYSTEMS.includes(houseSystem)) errors.houseSystem = "Sistema de casas inválido.";

  const choice = r.ambiguousChoice === "second" ? "second" : "first";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name: name || null,
      placeName,
      chart: {
        date,
        ...(timeUnknown ? {} : { time }),
        tz,
        lat: +lat.toFixed(4),
        lon: +lon.toFixed(4),
        timeUnknown,
        houseSystem,
        ambiguousChoice: choice,
      },
    },
  };
}
