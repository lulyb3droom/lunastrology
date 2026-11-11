import { describe, expect, it } from "vitest";
import { julianDay, resolveLocalInstant } from "@/lib/astro";
import fusos from "../fixtures/fusos-br.json";

const iso = (d: Date) => d.toISOString();

describe("hora local → UTC (Brasil)", () => {
  it("concorda com o gabarito independente (zoneinfo) em centenas de datas de 1960 a 2024", () => {
    expect(fusos.length).toBeGreaterThan(500);
    for (const c of fusos) {
      const r = resolveLocalInstant(c.date, c.time, c.tz);
      expect(r.status, `${c.date} ${c.time} ${c.tz}`).toBe("ok");
      expect(iso(r.utc), `${c.date} ${c.time} ${c.tz}`).toBe(c.utc);
      expect(r.offsetMinutes).toBe(c.offsetMin);
    }
  });

  it("horário de verão: São Paulo em janeiro de 1986 era UTC-2", () => {
    const r = resolveLocalInstant("1986-01-15", "14:30", "America/Sao_Paulo");
    expect(iso(r.utc)).toBe("1986-01-15T16:30:00.000Z");
    expect(r.offsetMinutes).toBe(-120);
  });

  it("sem horário de verão: São Paulo em julho é UTC-3", () => {
    const r = resolveLocalInstant("2019-07-03", "11:20", "America/Sao_Paulo");
    expect(iso(r.utc)).toBe("2019-07-03T14:20:00.000Z");
    expect(r.offsetMinutes).toBe(-180);
  });

  it("o horário de verão acabou em 2019: dezembro de 2019 já é UTC-3", () => {
    expect(resolveLocalInstant("2019-12-15", "12:00", "America/Sao_Paulo").offsetMinutes).toBe(-180);
    expect(resolveLocalInstant("2018-12-15", "12:00", "America/Sao_Paulo").offsetMinutes).toBe(-120);
  });

  it("Manaus nunca teve verão no período: sempre UTC-4", () => {
    expect(resolveLocalInstant("1982-01-10", "10:00", "America/Manaus").offsetMinutes).toBe(-240);
    expect(resolveLocalInstant("1982-08-14", "03:40", "America/Manaus").offsetMinutes).toBe(-240);
  });

  it("Rio Branco mudou de fuso ao longo dos anos (UTC-5 → UTC-4 → UTC-5)", () => {
    expect(resolveLocalInstant("2005-06-01", "12:00", "America/Rio_Branco").offsetMinutes).toBe(-300);
    expect(resolveLocalInstant("2010-06-01", "12:00", "America/Rio_Branco").offsetMinutes).toBe(-240);
    expect(resolveLocalInstant("2020-06-01", "12:00", "America/Rio_Branco").offsetMinutes).toBe(-300);
  });

  it("hora AMBÍGUA no fim do horário de verão (São Paulo, 08/02/1992 23:30)", () => {
    const first = resolveLocalInstant("1992-02-08", "23:30", "America/Sao_Paulo", "first");
    const second = resolveLocalInstant("1992-02-08", "23:30", "America/Sao_Paulo", "second");
    expect(first.status).toBe("ambiguous");
    expect(first.alternatives).toHaveLength(2);
    expect(iso(first.utc)).toBe("1992-02-09T01:30:00.000Z"); // UTC-2 (ainda no horário de verão)
    expect(iso(second.utc)).toBe("1992-02-09T02:30:00.000Z"); // UTC-3
  });

  it("hora INEXISTENTE no início do horário de verão (São Paulo, 19/10/2008 00:30)", () => {
    const r = resolveLocalInstant("2008-10-19", "00:30", "America/Sao_Paulo");
    expect(r.status).toBe("nonexistent");
  });

  it("rejeita fuso e data inválidos", () => {
    expect(() => resolveLocalInstant("2000-01-01", "10:00", "Marte/Olympus")).toThrow(/Fuso/);
    expect(() => resolveLocalInstant("2000-02-31", "10:00", "America/Sao_Paulo")).toThrow(/inválida/);
  });
});

describe("dia juliano", () => {
  it("J2000 = 2451545.0", () => {
    expect(julianDay(new Date("2000-01-01T12:00:00Z"))).toBe(2451545);
  });
  it("1986-01-15 16:30 UT", () => {
    expect(julianDay(new Date("1986-01-15T16:30:00Z"))).toBeCloseTo(2446446.1875, 6);
  });
});
