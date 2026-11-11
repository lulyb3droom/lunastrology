import { deg, norm360, rad } from "./math";
import type { HouseSystem } from "./types";

/** Meio do Céu (grau da eclíptica no meridiano). ramc e eps em graus. */
export function midheaven(ramc: number, eps: number): number {
  return norm360(deg(Math.atan2(Math.sin(rad(ramc)), Math.cos(rad(ramc)) * Math.cos(rad(eps)))));
}

/** Ascendente. ramc, eps e lat em graus. */
export function ascendant(ramc: number, eps: number, lat: number): number {
  const r = rad(ramc);
  const e = rad(eps);
  const y = Math.cos(r);
  const x = -(Math.sin(r) * Math.cos(e) + Math.tan(rad(lat)) * Math.sin(e));
  return norm360(deg(Math.atan2(y, x)));
}

/** Longitude eclíptica (latitude 0) de um ponto com ascensão reta `ra`. */
function lonFromRA(ra: number, eps: number): number {
  return norm360(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(rad(eps)))));
}

export class PolarHouseError extends Error {
  constructor() {
    super("Latitude alta demais para este sistema de casas.");
  }
}

/** Placidus: cúspides 11, 12, 2 e 3 por iteração dos semi-arcos. */
function placidusCusp(which: 11 | 12 | 2 | 3, ramc: number, eps: number, lat: number): number {
  const first = { 11: 30, 12: 60, 2: 120, 3: 150 }[which];
  let ra = ramc + first;
  for (let i = 0; i < 200; i++) {
    const lon = lonFromRA(ra, eps);
    const dec = Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lon)));
    const arg = -Math.tan(rad(lat)) * Math.tan(dec);
    if (!(Math.abs(arg) < 1)) throw new PolarHouseError();
    const dsa = deg(Math.acos(arg)); // semi-arco diurno
    const nsa = 180 - dsa; // semi-arco noturno
    const next =
      which === 11
        ? ramc + dsa / 3
        : which === 12
          ? ramc + (2 * dsa) / 3
          : which === 2
            ? ramc + 180 - (2 * nsa) / 3
            : ramc + 180 - nsa / 3;
    const done = Math.abs(next - ra) < 1e-10;
    ra = next;
    if (done) break;
  }
  return lonFromRA(ra, eps);
}

function fromAngles(asc: number, mc: number, c11: number, c12: number, c2: number, c3: number): number[] {
  return [
    asc,
    c2,
    c3,
    norm360(mc + 180),
    norm360(c11 + 180),
    norm360(c12 + 180),
    norm360(asc + 180),
    norm360(c2 + 180),
    norm360(c3 + 180),
    mc,
    c11,
    c12,
  ];
}

export function placidusCusps(ramc: number, eps: number, lat: number): number[] {
  return fromAngles(
    ascendant(ramc, eps, lat),
    midheaven(ramc, eps),
    placidusCusp(11, ramc, eps, lat),
    placidusCusp(12, ramc, eps, lat),
    placidusCusp(2, ramc, eps, lat),
    placidusCusp(3, ramc, eps, lat),
  );
}

/** Koch: divide em três o arco do Meio do Céu, usando a diferença ascensional dele. */
export function kochCusps(ramc: number, eps: number, lat: number): number[] {
  const mc = midheaven(ramc, eps);
  const decMc = Math.asin(Math.sin(rad(eps)) * Math.sin(rad(mc)));
  const arg = Math.tan(rad(lat)) * Math.tan(decMc);
  if (!(Math.abs(arg) < 1)) throw new PolarHouseError();
  const ad3 = deg(Math.asin(arg)) / 3;
  const asc = (r: number) => ascendant(r, eps, lat);
  return fromAngles(
    asc(ramc),
    mc,
    asc(ramc - 60 - 2 * ad3),
    asc(ramc - 30 - ad3),
    asc(ramc + 30 + ad3),
    asc(ramc + 60 + 2 * ad3),
  );
}

export function equalCusps(asc: number): number[] {
  return Array.from({ length: 12 }, (_, i) => norm360(asc + 30 * i));
}

export function wholeSignCusps(asc: number): number[] {
  const start = Math.floor(norm360(asc) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(start + 30 * i));
}

export interface HouseResult {
  cusps: number[];
  used: HouseSystem;
  fallbackReason?: "polar";
}

/** Calcula as 12 cúspides. Se Placidus/Koch não existirem naquela latitude, cai para Casas Inteiras. */
export function computeHouses(system: HouseSystem, ramc: number, eps: number, lat: number): HouseResult {
  const asc = ascendant(ramc, eps, lat);
  try {
    if (system === "placidus" || system === "koch") {
      if (Math.abs(lat) >= 90 - eps) throw new PolarHouseError();
      const cusps = system === "placidus" ? placidusCusps(ramc, eps, lat) : kochCusps(ramc, eps, lat);
      if (cusps.some((c) => !Number.isFinite(c))) throw new PolarHouseError();
      return { cusps, used: system };
    }
  } catch (e) {
    if (e instanceof PolarHouseError) {
      return { cusps: wholeSignCusps(asc), used: "whole-sign", fallbackReason: "polar" };
    }
    throw e;
  }
  if (system === "equal") return { cusps: equalCusps(asc), used: "equal" };
  return { cusps: wholeSignCusps(asc), used: "whole-sign" };
}

/** Em que casa (1 a 12) cai uma longitude. */
export function houseOf(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end = cusps[(i + 1) % 12]!;
    const span = norm360(end - start) || 360;
    if (norm360(longitude - start) < span) return i + 1;
  }
  return 12;
}
