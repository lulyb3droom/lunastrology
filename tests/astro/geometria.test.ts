import { describe, expect, it } from "vitest";
import { CENTER, polar, screenAngle, spreadLongitudes } from "@/components/chart/geometry";

describe("geometria da roda", () => {
  it("o Ascendente fica à esquerda do centro", () => {
    const p = polar(41.3, 41.3, 100);
    expect(p.x).toBeCloseTo(CENTER - 100, 6);
    expect(p.y).toBeCloseTo(CENTER, 6);
  });

  it("o zodíaco avança no sentido anti-horário: 90° depois do ASC fica EMBAIXO", () => {
    const p = polar(90, 0, 100);
    expect(p.x).toBeCloseTo(CENTER, 6);
    expect(p.y).toBeCloseTo(CENTER + 100, 6); // y maior = mais abaixo no SVG
  });

  it("180° depois do ASC (Descendente) fica à direita; 270° depois (MC se ASC≈MC-90) fica no topo", () => {
    const right = polar(180, 0, 100);
    expect(right.x).toBeCloseTo(CENTER + 100, 6);
    const top = polar(270, 0, 100);
    expect(top.y).toBeCloseTo(CENTER - 100, 6);
  });

  it("screenAngle volta ao mesmo ponto a cada 360°", () => {
    expect(screenAngle(10, 0) - screenAngle(370, 0)).toBeCloseTo(360, 6);
  });
});

describe("spreadLongitudes", () => {
  it("planetas distantes não se movem", () => {
    const m = spreadLongitudes([
      { id: "a", longitude: 10 },
      { id: "b", longitude: 100 },
    ]);
    expect(m.get("a")).toBeCloseTo(10, 6);
    expect(m.get("b")).toBeCloseTo(100, 6);
  });

  it("planetas na mesma posição são afastados em pelo menos o mínimo", () => {
    const items = [
      { id: "a", longitude: 100 },
      { id: "b", longitude: 100 },
      { id: "c", longitude: 101 },
    ];
    const m = spreadLongitudes(items, 9);
    const v = [...m.values()].sort((x, y) => x - y);
    expect(v[1]! - v[0]!).toBeGreaterThanOrEqual(9 - 1e-6);
    expect(v[2]! - v[1]!).toBeGreaterThanOrEqual(9 - 1e-6);
    // o grupo continua centrado onde estava
    expect((v[0]! + v[2]!) / 2).toBeCloseTo(100.33, 0);
  });

  it("funciona na virada de 360° (355°, 357° e 2°)", () => {
    const m = spreadLongitudes(
      [
        { id: "a", longitude: 355 },
        { id: "b", longitude: 357 },
        { id: "c", longitude: 2 },
      ],
      8,
    );
    const ordered = ["a", "b", "c"].map((id) => m.get(id)!);
    const gap = (x: number, y: number) => (((y - x) % 360) + 360) % 360;
    expect(gap(ordered[0]!, ordered[1]!)).toBeGreaterThanOrEqual(8 - 1e-6);
    expect(gap(ordered[1]!, ordered[2]!)).toBeGreaterThanOrEqual(8 - 1e-6);
  });
});
