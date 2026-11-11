import type { PlanetId } from "../types";

/**
 * Contrato da biblioteca de efemérides. Para trocar de biblioteca (ex.: Swiss Ephemeris)
 * basta criar outra implementação deste contrato; o resto do código não muda.
 */
export interface EphemerisProvider {
  /** Longitude eclíptica geocêntrica APARENTE (tropical, equinócio verdadeiro da data), em graus [0, 360). */
  apparentLongitude(body: PlanetId, date: Date): number;
  /** Tempo sideral aparente de Greenwich, em horas. */
  greenwichApparentSiderealTime(date: Date): number;
  /** Obliquidade verdadeira da eclíptica, em graus. */
  trueObliquity(date: Date): number;
  /** Séculos julianos desde J2000 em Tempo Terrestre (inclui ΔT). */
  centuriesTT(date: Date): number;
  /** Nutação em longitude, em graus. */
  nutationInLongitude(date: Date): number;
}
