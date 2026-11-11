// Configuração do cálculo, em UM só lugar. Mexa aqui para ajustar orbes e padrões.
import type { AspectType, HouseSystem } from "./types";

export const CALC_VERSION = "1.0.0";

export const DEFAULT_HOUSE_SYSTEM: HouseSystem = "placidus";

/** Quanto a Lua pode variar, em graus, quando a hora de nascimento é desconhecida. */
export const MOON_UNCERTAINTY_DEG = 6;

export interface AspectConfig {
  type: AspectType;
  angle: number;
  /** orbe padrão em graus */
  orb: number;
  /** orbe quando Sol ou Lua participam */
  luminaryOrb: number;
  /** incluído por padrão? */
  enabled: boolean;
}

export const ASPECTS: readonly AspectConfig[] = [
  { type: "conjunction", angle: 0, orb: 8, luminaryOrb: 10, enabled: true },
  { type: "opposition", angle: 180, orb: 8, luminaryOrb: 10, enabled: true },
  { type: "trine", angle: 120, orb: 8, luminaryOrb: 10, enabled: true },
  { type: "square", angle: 90, orb: 8, luminaryOrb: 10, enabled: true },
  { type: "sextile", angle: 60, orb: 6, luminaryOrb: 8, enabled: true },
  { type: "quincunx", angle: 150, orb: 3, luminaryOrb: 4, enabled: false },
];
