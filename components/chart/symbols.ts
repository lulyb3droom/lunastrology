import type { AspectType, BodyId } from "@/lib/astro";

// U+FE0E força a versão "texto" do símbolo (sem virar emoji colorido).
const T = "︎";

export const BODY_GLYPHS: Record<BodyId, string> = {
  sun: "☉" + T,
  moon: "☽" + T,
  mercury: "☿" + T,
  venus: "♀" + T,
  mars: "♂" + T,
  jupiter: "♃" + T,
  saturn: "♄" + T,
  uranus: "♅" + T,
  neptune: "♆" + T,
  pluto: "♇" + T,
  northNode: "☊" + T,
  southNode: "☋" + T,
  lilith: "⚸" + T,
  partOfFortune: "⊗" + T,
  asc: "AC",
  mc: "MC",
};

export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => g + T);

/**
 * Estilo das linhas de aspecto. Cor E padrão de traço: o significado nunca depende só da cor.
 * Classes escritas por extenso para o Tailwind encontrá-las.
 */
export const ASPECT_STYLE: Record<
  AspectType,
  { stroke: string; dash: string | undefined; width: number; family: "harmônico" | "tenso" | "neutro" }
> = {
  conjunction: { stroke: "stroke-white-cosmic", dash: undefined, width: 1.4, family: "neutro" },
  sextile: { stroke: "stroke-violet-astral", dash: "6 4", width: 1.6, family: "harmônico" },
  trine: { stroke: "stroke-violet-astral", dash: undefined, width: 1.8, family: "harmônico" },
  square: { stroke: "stroke-neon-nebula", dash: undefined, width: 1.8, family: "tenso" },
  opposition: { stroke: "stroke-neon-nebula", dash: "10 4", width: 1.8, family: "tenso" },
  quincunx: { stroke: "stroke-text-main", dash: "2 4", width: 1.2, family: "neutro" },
};
