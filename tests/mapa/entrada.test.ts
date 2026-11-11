import { describe, expect, it, vi } from "vitest";

// A validação usa o fuso por coordenada (tz-lookup) e importa o módulo de lugares, que importa o banco.
// O banco não é usado aqui, então isolamos esse módulo.
vi.mock("@/lib/db", () => ({ getDb: () => ({}), schema: {} }));

import { parseBirthInput } from "@/lib/charts/input";
import { buildDisplayName, normalizeQuery, parseNominatim } from "@/lib/geo/places";

const valido = {
  name: "  Ana  ",
  date: "1986-01-15",
  time: "14:30",
  timeUnknown: false,
  houseSystem: "placidus",
  placeName: "São Paulo, São Paulo, Brasil",
  lat: -23.5505,
  lon: -46.6333,
};

describe("parseBirthInput", () => {
  it("aceita dados válidos, apara o nome e calcula o fuso a partir das coordenadas", () => {
    const r = parseBirthInput(valido);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.name).toBe("Ana");
    expect(r.data.chart.tz).toBe("America/Sao_Paulo");
    expect(r.data.chart.time).toBe("14:30");
  });

  it("ignora um fuso enviado pelo navegador (nunca confia nele)", () => {
    const r = parseBirthInput({ ...valido, tz: "Asia/Tokyo" });
    expect(r.ok && r.data.chart.tz).toBe("America/Sao_Paulo");
  });

  it("sem hora: não exige hora e não guarda a hora digitada", () => {
    const r = parseBirthInput({ ...valido, time: "", timeUnknown: true });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.chart.timeUnknown).toBe(true);
      expect(r.data.chart.time).toBeUndefined();
    }
  });

  it("recusa data impossível, futura e anterior a 1800", () => {
    for (const date of ["1986-02-31", "abc", "", "1799-12-31", "2999-01-01"]) {
      const r = parseBirthInput({ ...valido, date });
      expect(r.ok, date).toBe(false);
      if (!r.ok) expect(r.errors.date).toBeTruthy();
    }
  });

  it("recusa hora inválida", () => {
    for (const time of ["25:00", "12:60", "", "12h"]) {
      const r = parseBirthInput({ ...valido, time });
      expect(r.ok, time).toBe(false);
    }
  });

  it("exige cidade escolhida da lista (nome + coordenadas)", () => {
    expect(parseBirthInput({ ...valido, placeName: "" }).ok).toBe(false);
    expect(parseBirthInput({ ...valido, lat: null }).ok).toBe(false);
    expect(parseBirthInput({ ...valido, lat: 999 }).ok).toBe(false);
    expect(parseBirthInput({ ...valido, lon: "x" }).ok).toBe(false);
  });

  it("recusa sistema de casas desconhecido", () => {
    const r = parseBirthInput({ ...valido, houseSystem: "regiomontanus" });
    expect(r.ok).toBe(false);
  });

  it("não quebra com entrada maluca", () => {
    expect(parseBirthInput(null).ok).toBe(false);
    expect(parseBirthInput("texto").ok).toBe(false);
    expect(parseBirthInput({}).ok).toBe(false);
  });
});

describe("geocodificação (leitura do Nominatim)", () => {
  it("normaliza a busca: minúsculas, sem acento, espaços únicos", () => {
    expect(normalizeQuery("  São   PAULO ")).toBe("sao paulo");
    expect(normalizeQuery("Goiânia")).toBe("goiania");
  });

  it("monta o nome de exibição sem repetir partes", () => {
    expect(
      buildDisplayName({
        lat: "0",
        lon: "0",
        address: { city: "Goiânia", state: "Goiás", country: "Brasil" },
      }),
    ).toBe("Goiânia, Goiás, Brasil");
    expect(
      buildDisplayName({ lat: "0", lon: "0", address: { city: "Singapura", state: "Singapura", country: "Singapura" } }),
    ).toBe("Singapura");
  });

  it("converte os resultados, descarta repetidos e coordenadas inválidas, e descobre o fuso", () => {
    const places = parseNominatim([
      { lat: "-16.6786", lon: "-49.2539", address: { city: "Goiânia", state: "Goiás", country: "Brasil" } },
      { lat: "-16.68", lon: "-49.25", address: { city: "Goiânia", state: "Goiás", country: "Brasil" } },
      { lat: "abc", lon: "1", address: { city: "Lixo" } },
      { lat: "-3.1190", lon: "-60.0217", address: { city: "Manaus", state: "Amazonas", country: "Brasil" } },
    ]);
    expect(places.map((p) => p.displayName)).toEqual(["Goiânia, Goiás, Brasil", "Manaus, Amazonas, Brasil"]);
    expect(places[0]!.tz).toBe("America/Sao_Paulo");
    expect(places[1]!.tz).toBe("America/Manaus");
  });
});
