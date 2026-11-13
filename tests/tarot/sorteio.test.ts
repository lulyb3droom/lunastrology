import { describe, expect, it } from "vitest";
import { TAROT_DECK, getCard } from "@/data/tarot/cartas";
import { drawSpread, reversedChanceFromEnv, shuffle, type Rng } from "@/lib/tarot/draw";
import { SPREADS } from "@/lib/tarot/spreads";

/** gerador determinístico (LCG) só para testes */
function seeded(seed: number): Rng {
  let s = seed;
  return {
    int(max) {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return Math.floor((s / 4294967296) * max);
    },
  };
}

describe("baralho", () => {
  it("tem 78 cartas únicas: 22 Maiores + 56 Menores (14 por naipe)", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(new Set(TAROT_DECK.map((c) => c.id)).size).toBe(78);
    expect(TAROT_DECK.filter((c) => c.arcana === "maior")).toHaveLength(22);
    for (const suit of ["paus", "copas", "espadas", "ouros"]) {
      expect(TAROT_DECK.filter((c) => c.suit === suit)).toHaveLength(14);
    }
  });

  it("toda carta tem nome, palavras-chave e significados direito e invertido", () => {
    for (const c of TAROT_DECK) {
      expect(c.name.length, c.id).toBeGreaterThan(2);
      expect(c.keywords.length, c.id).toBeGreaterThanOrEqual(3);
      expect(c.upright.length, c.id).toBeGreaterThan(30);
      expect(c.reversed.length, c.id).toBeGreaterThan(20);
      expect(getCard(c.id)).toBe(c);
    }
  });

  it("os números dos Maiores vão de 0 a 21 e os dos Menores de 1 a 14", () => {
    expect(TAROT_DECK.filter((c) => c.arcana === "maior").map((c) => c.number)).toEqual(
      Array.from({ length: 22 }, (_, i) => i),
    );
    expect(TAROT_DECK.filter((c) => c.suit === "copas").map((c) => c.number)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 1),
    );
  });

  it("cada carta tem a imagem correspondente em public/tarot", async () => {
    const { existsSync } = await import("node:fs");
    for (const c of TAROT_DECK) expect(existsSync(`public/tarot/${c.id}.webp`), c.id).toBe(true);
  });

  it("os textos não fazem previsões fatalistas (palavras proibidas pela constituição)", () => {
    const proibidas = /\b(morrer|morrerá|doença grave|câncer|gravidez|acidente fatal|falecimento)\b/i;
    for (const c of TAROT_DECK) {
      expect(proibidas.test(c.upright + " " + c.reversed), c.id).toBe(false);
    }
  });
});

describe("tiragens", () => {
  it("têm o número certo de posições", () => {
    expect(Object.fromEntries(SPREADS.map((s) => [s.id, s.positions.length]))).toEqual({
      "carta-do-dia": 1,
      "passado-presente-futuro": 3,
      "situacao-obstaculo-conselho": 3,
      "cruz-celta": 10,
    });
  });
});

describe("shuffle (Fisher–Yates)", () => {
  it("é uma permutação: mesmos elementos, sem perder nem repetir", () => {
    const original = Array.from({ length: 78 }, (_, i) => i);
    const out = shuffle(original, seeded(1));
    expect([...out].sort((a, b) => a - b)).toEqual(original);
  });

  it("não altera o array original", () => {
    const original = [1, 2, 3, 4, 5];
    shuffle(original, seeded(2));
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });

  it("com o gerador criptográfico real, cada carta tem chance ~igual de ficar na 1ª posição", () => {
    const N = 39_000; // esperado: 500 por carta
    const counts = new Map<string, number>();
    for (let i = 0; i < N; i++) {
      const [first] = drawSpread("carta-do-dia", { reversedChance: 0 });
      counts.set(first!.cardId, (counts.get(first!.cardId) ?? 0) + 1);
    }
    expect(counts.size).toBe(78); // todas aparecem
    const expected = N / 78;
    // qui-quadrado: com 77 graus de liberdade, o valor crítico a 0,1% é ~ 120
    const chi2 = [...counts.values()].reduce((acc, o) => acc + (o - expected) ** 2 / expected, 0);
    expect(chi2).toBeLessThan(125);
  });
});

describe("drawSpread", () => {
  it("nunca repete carta na mesma tiragem (Cruz Celta, 1000 vezes)", () => {
    for (let i = 0; i < 1000; i++) {
      const cards = drawSpread("cruz-celta");
      expect(cards).toHaveLength(10);
      expect(new Set(cards.map((c) => c.cardId)).size).toBe(10);
      expect(cards.map((c) => c.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it("é reproduzível com a mesma semente (útil para testes) e usa só cartas do baralho", () => {
    const a = drawSpread("passado-presente-futuro", { rng: seeded(7) });
    const b = drawSpread("passado-presente-futuro", { rng: seeded(7) });
    expect(a).toEqual(b);
    for (const c of a) expect(getCard(c.cardId)).toBeDefined();
  });

  it("a chance de invertida é respeitada (~30%, ~0% e 100%)", () => {
    const rate = (chance: number) => {
      let rev = 0;
      const total = 20_000;
      for (let i = 0; i < total; i++) if (drawSpread("carta-do-dia", { reversedChance: chance })[0]!.reversed) rev++;
      return rev / total;
    };
    expect(rate(0.3)).toBeGreaterThan(0.28);
    expect(rate(0.3)).toBeLessThan(0.32);
    expect(rate(0)).toBe(0);
    expect(rate(1)).toBe(1);
  });

  it("rejeita tiragem desconhecida", () => {
    // @ts-expect-error valor fora do tipo, de propósito
    expect(() => drawSpread("tiragem-inventada")).toThrow(/desconhecida/);
  });
});

describe("TAROT_REVERSED_CHANCE", () => {
  it("usa 0,3 por padrão e limita o valor entre 0 e 1", () => {
    expect(reversedChanceFromEnv(undefined)).toBe(0.3);
    expect(reversedChanceFromEnv("")).toBe(0.3);
    expect(reversedChanceFromEnv("abc")).toBe(0.3);
    expect(reversedChanceFromEnv("0.5")).toBe(0.5);
    expect(reversedChanceFromEnv("7")).toBe(1);
    expect(reversedChanceFromEnv("-2")).toBe(0);
  });
});
