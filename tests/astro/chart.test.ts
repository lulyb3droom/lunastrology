import { describe, expect, it } from "vitest";
import { calculateChart, formatPosition } from "@/lib/astro";

const base = { date: "1986-01-15", time: "14:30", tz: "America/Sao_Paulo", lat: -23.5505, lon: -46.6333 };

describe("calculateChart", () => {
  it("é determinística (mesma entrada, mesma saída)", () => {
    expect(calculateChart(base)).toEqual(calculateChart(base));
  });

  it("Sol de 15/01/1986 está em Capricórnio, e o resultado traz Big Three e casas", () => {
    const c = calculateChart(base);
    expect(c.bodies.sun!.signName).toBe("Capricórnio");
    expect(c.summary.bigThree.asc).not.toBeNull();
    expect(c.cusps).toHaveLength(12);
    expect(c.houseSystemUsed).toBe("placidus");
    expect(c.bodies.sun!.house).toBeGreaterThanOrEqual(1);
    expect(c.calcVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("a soma dos elementos e das modalidades é 10 (planetas)", () => {
    const { elements, modalities } = calculateChart(base).summary;
    expect(Object.values(elements).reduce((a, b) => a + b, 0)).toBe(10);
    expect(Object.values(modalities).reduce((a, b) => a + b, 0)).toBe(10);
  });

  it("regente do mapa vem do signo do Ascendente", () => {
    const c = calculateChart(base);
    expect(c.bodies.asc!.signName).toBe("Touro"); // ASC ≈ 11° de Touro
    expect(c.summary.chartRuler).toEqual({ traditional: "venus", modern: "venus" });
  });

  it("Nodo Sul é exatamente oposto ao Nodo Norte", () => {
    const c = calculateChart(base);
    const diff = Math.abs(c.bodies.southNode!.longitude - c.bodies.northNode!.longitude);
    expect(diff).toBeCloseTo(180, 8);
  });

  it("aspectos vêm ordenados do mais exato ao menos exato", () => {
    const orbs = calculateChart(base).aspects.map((a) => a.orb);
    expect([...orbs].sort((a, b) => a - b)).toEqual(orbs);
  });

  it("sem hora: usa 12:00 local e a hora informada é ignorada", () => {
    const a = calculateChart({ ...base, time: "03:00", timeUnknown: true });
    const b = calculateChart({ ...base, time: "23:59", timeUnknown: true });
    expect(a.bodies).toEqual(b.bodies);
    expect(a.instant.utcIso).toBe("1986-01-15T14:00:00.000Z".replace("14", "14")); // 12:00 em UTC-2
    expect(a.aspects.some((x) => x.a === "asc" || x.b === "asc" || x.a === "mc" || x.b === "mc")).toBe(false);
  });

  it("avisa sobre hora ambígua e hora inexistente do horário de verão", () => {
    const amb = calculateChart({ ...base, date: "1992-02-08", time: "23:30" });
    expect(amb.instant.status).toBe("ambiguous");
    expect(amb.warnings.join(" ")).toMatch(/duas vezes/);
    const none = calculateChart({ ...base, date: "2008-10-19", time: "00:30" });
    expect(none.instant.status).toBe("nonexistent");
    expect(none.warnings.join(" ")).toMatch(/não existiu/);
  });

  it("rejeita zodíaco sideral (ainda não suportado), coordenadas e hora ausente", () => {
    // @ts-expect-error valor fora do tipo, de propósito
    expect(() => calculateChart({ ...base, zodiac: "sideral" })).toThrow(/tropical/);
    expect(() => calculateChart({ ...base, lat: 120 })).toThrow(/Coordenadas/);
    expect(() => calculateChart({ ...base, time: undefined })).toThrow(/hora/);
  });

  it("Whole Sign e Iguais produzem 12 cúspides e o mesmo Ascendente", () => {
    const w = calculateChart({ ...base, houseSystem: "whole-sign" });
    const e = calculateChart({ ...base, houseSystem: "equal" });
    expect(w.cusps).toHaveLength(12);
    expect(w.bodies.asc!.longitude).toBeCloseTo(e.bodies.asc!.longitude, 10);
  });
});

describe("formatPosition", () => {
  it("formata grau, minuto e signo", () => {
    expect(formatPosition(134.4)).toBe("14°24' de Leão");
    expect(formatPosition(0)).toBe("0°00' de Áries");
    expect(formatPosition(359.999)).toBe("29°59' de Peixes");
  });
});
