import type { HouseSystem } from "@/lib/astro";

// Arquivo sem dependências de servidor: pode ser usado em componentes do navegador.
export const HOUSE_SYSTEMS: readonly HouseSystem[] = ["placidus", "whole-sign", "equal", "koch"];

export const HOUSE_SYSTEM_LABELS: Record<HouseSystem, string> = {
  placidus: "Placidus",
  "whole-sign": "Casas Inteiras",
  equal: "Casas Iguais",
  koch: "Koch",
};
