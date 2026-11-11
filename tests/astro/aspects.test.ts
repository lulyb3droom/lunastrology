import { describe, expect, it } from "vitest";
import { computeAspects } from "@/lib/astro";
import { houseOf, wholeSignCusps, equalCusps } from "@/lib/astro/houses";

describe("aspectos", () => {
  it("detecta os cinco aspectos maiores com o orbe certo", () => {
    const r = computeAspects([
      { id: "mars", longitude: 10, speed: 0.5 },
      { id: "venus", longitude: 15, speed: 1 }, // conjunção, orbe 5
      { id: "saturn", longitude: 195, speed: 0.1 }, // 185° de Marte: oposição, orbe 5
      { id: "jupiter", longitude: 70, speed: 0.1 }, // sextil a Marte (orbe 0)
      { id: "neptune", longitude: 130, speed: 0.01 }, // 120° de Marte: trígono, orbe 0
      { id: "pluto", longitude: 100, speed: 0.01 }, // 90° de Marte: quadratura, orbe 0
      { id: "uranus", longitude: 232, speed: 0.01 }, // 222° de Marte = 138° de distância: nada
    ]);
    const byPair = Object.fromEntries(r.map((a) => [`${a.a}-${a.b}`, a]));
    expect(byPair["mars-venus"]?.type).toBe("conjunction");
    expect(byPair["mars-venus"]?.orb).toBeCloseTo(5, 10);
    expect(byPair["mars-saturn"]?.type).toBe("opposition");
    expect(byPair["mars-saturn"]?.orb).toBeCloseTo(5, 10);
    expect(byPair["mars-jupiter"]?.type).toBe("sextile");
    expect(byPair["mars-neptune"]?.type).toBe("trine");
    expect(byPair["mars-pluto"]?.type).toBe("square");
    expect(byPair["mars-uranus"]).toBeUndefined();
  });

  it("atravessa a virada de 360° (358° e 4° estão a 6°: conjunção)", () => {
    const r = computeAspects([
      { id: "mars", longitude: 358, speed: 0 },
      { id: "venus", longitude: 4, speed: 0 },
    ]);
    expect(r[0]?.type).toBe("conjunction");
    expect(r[0]?.orb).toBeCloseTo(6, 10);
  });

  it("fora do orbe não forma aspecto (356° e 5° estão a 9°)", () => {
    expect(
      computeAspects([
        { id: "mars", longitude: 356, speed: 0 },
        { id: "venus", longitude: 5, speed: 0 },
      ]),
    ).toHaveLength(0);
  });

  it("Sol e Lua têm orbe maior (10° contra 8°)", () => {
    const withSun = computeAspects([
      { id: "sun", longitude: 0, speed: 1 },
      { id: "mars", longitude: 9, speed: 0.5 },
    ]);
    const withoutSun = computeAspects([
      { id: "mercury", longitude: 0, speed: 1 },
      { id: "mars", longitude: 9, speed: 0.5 },
    ]);
    expect(withSun).toHaveLength(1);
    expect(withoutSun).toHaveLength(0);
  });

  it("aplicativo x separativo", () => {
    // Lua (rápida) a 100°, Sol a 105°: Lua se aproxima do Sol => aplicativo
    const app = computeAspects([
      { id: "moon", longitude: 100, speed: 13 },
      { id: "sun", longitude: 105, speed: 1 },
    ]);
    expect(app[0]?.applying).toBe(true);
    // Lua já passou (110° vs Sol a 105°) => separativo
    const sep = computeAspects([
      { id: "moon", longitude: 110, speed: 13 },
      { id: "sun", longitude: 105, speed: 1 },
    ]);
    expect(sep[0]?.applying).toBe(false);
  });

  it("planeta retrógrado: o aplicativo/separativo considera o sentido do movimento", () => {
    // Separação 85°; quadratura exata em 90°. Marte recuando AUMENTA a separação (85 → 85,3): aplicativo.
    const closing = computeAspects([
      { id: "mars", longitude: 100, speed: -0.3 },
      { id: "saturn", longitude: 185, speed: 0.05 },
    ]);
    expect(closing[0]?.type).toBe("square");
    expect(closing[0]?.applying).toBe(true);
    // Separação 95°; recuando, aumenta ainda mais (95 → 95,3): se afasta dos 90°, separativo.
    const opening = computeAspects([
      { id: "mars", longitude: 100, speed: -0.3 },
      { id: "saturn", longitude: 195, speed: 0.05 },
    ]);
    expect(opening[0]?.applying).toBe(false);
  });

  it("ASC/MC não têm aplicativo/separativo e ASC-MC não forma aspecto", () => {
    const r = computeAspects([
      { id: "asc", longitude: 0, speed: null },
      { id: "mc", longitude: 90, speed: null },
      { id: "sun", longitude: 3, speed: 1 },
    ]);
    expect(r.find((a) => a.a === "asc" && a.b === "mc")).toBeUndefined();
    expect(r.find((a) => a.a === "asc" && a.b === "sun")?.applying).toBeNull();
  });

  it("quincúncio só entra quando pedido", () => {
    const bodies = [
      { id: "mars" as const, longitude: 0, speed: 0 },
      { id: "venus" as const, longitude: 150, speed: 0 },
    ];
    expect(computeAspects(bodies)).toHaveLength(0);
    expect(computeAspects(bodies, { includeAll: true })[0]?.type).toBe("quincunx");
  });
});

describe("casas: auxiliares", () => {
  it("Casas Inteiras começam no 0° do signo do Ascendente", () => {
    const c = wholeSignCusps(41.3);
    expect(c[0]).toBe(30);
    expect(c[11]).toBe(0);
  });
  it("Casas Iguais começam exatamente no Ascendente", () => {
    const c = equalCusps(41.3);
    expect(c[0]).toBeCloseTo(41.3, 10);
    expect(c[1]).toBeCloseTo(71.3, 10);
  });
  it("houseOf atravessa 360°", () => {
    const cusps = equalCusps(350); // casa 1 = 350°..20°
    expect(houseOf(355, cusps)).toBe(1);
    expect(houseOf(10, cusps)).toBe(1);
    expect(houseOf(25, cusps)).toBe(2);
  });
});
