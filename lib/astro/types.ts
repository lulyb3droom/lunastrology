export type PlanetId =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type PointId = "northNode" | "southNode" | "lilith" | "partOfFortune";
export type AngleId = "asc" | "mc";
export type BodyId = PlanetId | PointId | AngleId;

export type Element = "fogo" | "terra" | "ar" | "água";
export type Modality = "cardinal" | "fixo" | "mutável";

export type HouseSystem = "placidus" | "whole-sign" | "equal" | "koch";

export interface SignInfo {
  id: string;
  name: string;
  symbol: string;
  element: Element;
  modality: Modality;
  rulerTraditional: PlanetId;
  rulerModern: PlanetId;
}

/** Entrada do cálculo. Data e hora são LOCAIS do lugar de nascimento. */
export interface ChartInput {
  /** AAAA-MM-DD */
  date: string;
  /** HH:MM (ignorado se timeUnknown) */
  time?: string;
  /** Nome IANA do fuso, ex.: "America/Sao_Paulo" */
  tz: string;
  lat: number;
  lon: number;
  timeUnknown?: boolean;
  houseSystem?: HouseSystem;
  /** Reservado para o futuro (zodíaco sideral). Só "tropical" é suportado. */
  zodiac?: "tropical";
  /** Se a hora local for ambígua (fim do horário de verão): usar a 1ª ou a 2ª ocorrência. */
  ambiguousChoice?: "first" | "second";
}

export interface PlacedPoint {
  id: BodyId;
  longitude: number;
  signIndex: number;
  signName: string;
  degree: number;
  minute: number;
  /** graus por dia (nulo quando não se aplica, ex.: ASC/MC) */
  speed: number | null;
  retrograde: boolean;
  /** 1 a 12; ausente se hora desconhecida */
  house?: number;
}

export interface HouseCusp {
  /** 1 a 12 */
  house: number;
  longitude: number;
  signIndex: number;
  signName: string;
  degree: number;
  minute: number;
}

export type AspectType = "conjunction" | "opposition" | "trine" | "square" | "sextile" | "quincunx";

export interface Aspect {
  a: BodyId;
  b: BodyId;
  type: AspectType;
  /** ângulo exato do aspecto (0, 60, 90...) */
  angle: number;
  /** diferença, em graus, entre o ângulo real e o exato */
  orb: number;
  /** true = aplicativo; false = separativo; null = não se aplica */
  applying: boolean | null;
}

export interface ChartSummary {
  elements: Record<Element, number>;
  modalities: Record<Modality, number>;
  dominantElement: Element;
  dominantModality: Modality;
  /** regente do signo do Ascendente (null se hora desconhecida) */
  chartRuler: { traditional: PlanetId; modern: PlanetId } | null;
  bigThree: { sun: PlacedPoint; moon: PlacedPoint; asc: PlacedPoint | null };
}

export interface ChartResult {
  calcVersion: string;
  input: ChartInput;
  instant: {
    utcIso: string;
    jdUt: number;
    offsetMinutes: number;
    /** "ambiguous" e "nonexistent" geram aviso em warnings */
    status: "ok" | "ambiguous" | "nonexistent";
  };
  houseSystemRequested: HouseSystem;
  /** Sistema realmente usado (pode ser "whole-sign" por fallback polar). Nulo sem hora. */
  houseSystemUsed: HouseSystem | null;
  warnings: string[];
  bodies: Partial<Record<BodyId, PlacedPoint>>;
  /** 12 cúspides; ausente se hora desconhecida */
  cusps?: HouseCusp[];
  aspects: Aspect[];
  summary: ChartSummary;
}
