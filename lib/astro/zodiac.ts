import { norm360 } from "./math";
import type { AspectType, BodyId, Element, Modality, PlanetId, SignInfo } from "./types";

export const SIGNS: readonly SignInfo[] = [
  { id: "aries", name: "Áries", symbol: "♈", element: "fogo", modality: "cardinal", rulerTraditional: "mars", rulerModern: "mars" },
  { id: "taurus", name: "Touro", symbol: "♉", element: "terra", modality: "fixo", rulerTraditional: "venus", rulerModern: "venus" },
  { id: "gemini", name: "Gêmeos", symbol: "♊", element: "ar", modality: "mutável", rulerTraditional: "mercury", rulerModern: "mercury" },
  { id: "cancer", name: "Câncer", symbol: "♋", element: "água", modality: "cardinal", rulerTraditional: "moon", rulerModern: "moon" },
  { id: "leo", name: "Leão", symbol: "♌", element: "fogo", modality: "fixo", rulerTraditional: "sun", rulerModern: "sun" },
  { id: "virgo", name: "Virgem", symbol: "♍", element: "terra", modality: "mutável", rulerTraditional: "mercury", rulerModern: "mercury" },
  { id: "libra", name: "Libra", symbol: "♎", element: "ar", modality: "cardinal", rulerTraditional: "venus", rulerModern: "venus" },
  { id: "scorpio", name: "Escorpião", symbol: "♏", element: "água", modality: "fixo", rulerTraditional: "mars", rulerModern: "pluto" },
  { id: "sagittarius", name: "Sagitário", symbol: "♐", element: "fogo", modality: "mutável", rulerTraditional: "jupiter", rulerModern: "jupiter" },
  { id: "capricorn", name: "Capricórnio", symbol: "♑", element: "terra", modality: "cardinal", rulerTraditional: "saturn", rulerModern: "saturn" },
  { id: "aquarius", name: "Aquário", symbol: "♒", element: "ar", modality: "fixo", rulerTraditional: "saturn", rulerModern: "uranus" },
  { id: "pisces", name: "Peixes", symbol: "♓", element: "água", modality: "mutável", rulerTraditional: "jupiter", rulerModern: "neptune" },
];

export const ELEMENTS: readonly Element[] = ["fogo", "terra", "ar", "água"];
export const MODALITIES: readonly Modality[] = ["cardinal", "fixo", "mutável"];

export const PLANET_NAMES: Record<PlanetId, string> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Netuno",
  pluto: "Plutão",
};

/** Posição dentro do zodíaco: signo, grau e minuto (truncados, como se usa em astrologia). */
export function locate(longitude: number) {
  const lon = norm360(longitude);
  const signIndex = Math.floor(lon / 30);
  const within = lon - signIndex * 30;
  let degree = Math.floor(within);
  // 1e-7 minuto de folga evita que erro de ponto flutuante (14,3999999…) mostre 14°23' em vez de 14°24'.
  let minute = Math.floor((within - degree) * 60 + 1e-7);
  if (minute === 60) {
    minute = 0;
    degree += 1;
  }
  return { longitude: lon, signIndex, degree, minute };
}

/** Exemplo: 14°23' de Leão. */
export function formatPosition(longitude: number): string {
  const p = locate(longitude);
  return `${p.degree}°${String(p.minute).padStart(2, "0")}' de ${SIGNS[p.signIndex]!.name}`;
}

export const BODY_NAMES: Record<BodyId, string> = {
  ...PLANET_NAMES,
  northNode: "Nodo Norte",
  southNode: "Nodo Sul",
  lilith: "Lilith",
  partOfFortune: "Parte da Fortuna",
  asc: "Ascendente",
  mc: "Meio do Céu",
};

export const ASPECT_NAMES: Record<AspectType, string> = {
  conjunction: "Conjunção",
  opposition: "Oposição",
  trine: "Trígono",
  square: "Quadratura",
  sextile: "Sextil",
  quincunx: "Quincúncio",
};

/** Ex.: "14°23'" (grau e minuto dentro do signo). */
export function formatDegMin(p: { degree: number; minute: number }): string {
  return `${p.degree}°${String(p.minute).padStart(2, "0")}'`;
}

/** Orbe em graus e minutos, arredondando o minuto: 2,0833 → "2°05'". */
export function formatOrb(orb: number): string {
  let d = Math.floor(orb);
  let m = Math.round((orb - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}°${String(m).padStart(2, "0")}'`;
}
