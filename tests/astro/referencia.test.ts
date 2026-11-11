import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astro";
import type { BodyId, HouseSystem } from "@/lib/astro";
import fixture from "../fixtures/mapas-referencia.json";

// Tolerâncias do spec: planetas ≤ 1' de arco; Ascendente/MC (e cúspides) ≤ 5'.
const TOL_PLANET = 1 / 60;
const TOL_ANGLE = 5 / 60;

type Ref = (typeof fixture.mapas)[number];
const mapas = fixture.mapas as Ref[];

/** diferença angular em graus, considerando a volta em 360° */
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

const PLANETS = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
] as const;

describe.each(mapas)("mapa de referência: $label", (ref) => {
  const chart = calculateChart({
    date: ref.input.date,
    time: ref.input.time,
    tz: ref.input.tz,
    lat: ref.input.lat,
    lon: ref.input.lon,
    timeUnknown: ref.input.timeUnknown,
  });

  it("converte a hora local para o mesmo UTC do gabarito", () => {
    expect(chart.instant.utcIso.slice(0, 19) + "Z").toBe(ref.utc);
    expect(chart.instant.offsetMinutes).toBe(ref.offsetMin);
  });

  it.each(PLANETS)("%s a até 1' de arco e com o mesmo sentido (direto/retrógrado)", (id) => {
    const expected = (ref.planets as Record<string, { lon: number; speed: number }>)[id]!;
    const got = chart.bodies[id]!;
    expect(diff(got.longitude, expected.lon)).toBeLessThanOrEqual(TOL_PLANET);
    expect(got.retrograde).toBe(expected.speed < 0);
  });

  it("Nodo Norte médio a até 1'", () => {
    expect(diff(chart.bodies.northNode!.longitude, ref.meanNode.lon)).toBeLessThanOrEqual(TOL_PLANET);
    expect(diff(chart.bodies.southNode!.longitude, ref.meanNode.lon + 180)).toBeLessThanOrEqual(TOL_PLANET);
  });

  it("Lilith média a até 1'", () => {
    expect(diff(chart.bodies.lilith!.longitude, ref.meanApogee.lon)).toBeLessThanOrEqual(TOL_PLANET);
  });

  if (ref.input.timeUnknown) {
    it("sem hora: não mostra Ascendente, MC, casas nem Parte da Fortuna, e avisa", () => {
      expect(chart.bodies.asc).toBeUndefined();
      expect(chart.bodies.mc).toBeUndefined();
      expect(chart.bodies.partOfFortune).toBeUndefined();
      expect(chart.cusps).toBeUndefined();
      expect(chart.houseSystemUsed).toBeNull();
      expect(chart.bodies.sun!.house).toBeUndefined();
      expect(chart.summary.chartRuler).toBeNull();
      expect(chart.warnings.join(" ")).toMatch(/meio-dia/);
    });
    return;
  }

  const r = ref as Ref & { asc: number; mc: number; partOfFortune: number; houses: Record<string, number[] | null> };

  it("Ascendente e Meio do Céu a até 5'", () => {
    expect(diff(chart.bodies.asc!.longitude, r.asc)).toBeLessThanOrEqual(TOL_ANGLE);
    expect(diff(chart.bodies.mc!.longitude, r.mc)).toBeLessThanOrEqual(TOL_ANGLE);
  });

  it("Parte da Fortuna a até 5'", () => {
    expect(diff(chart.bodies.partOfFortune!.longitude, r.partOfFortune)).toBeLessThanOrEqual(TOL_ANGLE);
  });

  const systems: [HouseSystem, string][] = [
    ["placidus", "placidus"],
    ["koch", "koch"],
    ["equal", "equal"],
    ["whole-sign", "whole"],
  ];
  describe.each(systems)("casas %s", (system, key) => {
    const expected = r.houses[key];
    const c = calculateChart({
      date: ref.input.date,
      time: ref.input.time,
      tz: ref.input.tz,
      lat: ref.input.lat,
      lon: ref.input.lon,
      houseSystem: system,
    });

    if (expected) {
      it("12 cúspides a até 5' do gabarito", () => {
        expect(c.houseSystemUsed).toBe(system);
        c.cusps!.forEach((cusp, i) => {
          expect(diff(cusp.longitude, expected[i]!), `cúspide ${i + 1}`).toBeLessThanOrEqual(TOL_ANGLE);
        });
      });
    } else {
      it("latitude polar: cai para Casas Inteiras e avisa", () => {
        expect(c.houseSystemUsed).toBe("whole-sign");
        expect(c.warnings.join(" ")).toMatch(/66,5/);
        c.cusps!.forEach((cusp, i) => {
          expect(diff(cusp.longitude, r.houses.whole![i]!)).toBeLessThanOrEqual(TOL_ANGLE);
        });
      });
    }
  });

  it("cada planeta cai na casa Placidus certa (conforme as cúspides do gabarito)", () => {
    const cusps = r.houses.placidus ?? r.houses.whole!;
    for (const id of PLANETS) {
      const lon = (ref.planets as Record<string, { lon: number }>)[id]!.lon;
      let expectedHouse = 12;
      for (let i = 0; i < 12; i++) {
        const start = cusps[i]!;
        const span = (((cusps[(i + 1) % 12]! - start) % 360) + 360) % 360;
        if ((((lon - start) % 360) + 360) % 360 < span) {
          expectedHouse = i + 1;
          break;
        }
      }
      // perto de uma cúspide, 5' de diferença pode mudar a casa: só cobramos quando há folga
      const nearCusp = cusps.some((c) => diff(lon, c) < TOL_ANGLE);
      if (!nearCusp) expect(chart.bodies[id as BodyId]!.house, id).toBe(expectedHouse);
    }
  });
});
