export type SpreadId = "carta-do-dia" | "passado-presente-futuro" | "situacao-obstaculo-conselho" | "cruz-celta";

export interface SpreadPosition {
  /** nome curto da posição */
  name: string;
  /** o que esta posição representa */
  hint: string;
}

export interface Spread {
  id: SpreadId;
  name: string;
  description: string;
  positions: SpreadPosition[];
}

export const SPREADS: readonly Spread[] = [
  {
    id: "carta-do-dia",
    name: "Carta do dia",
    description: "Uma carta para refletir sobre o seu dia.",
    positions: [{ name: "A carta do dia", hint: "O tema para observar hoje." }],
  },
  {
    id: "passado-presente-futuro",
    name: "Passado, Presente e Futuro",
    description: "Três cartas para ver de onde você vem, onde está e para onde pode ir.",
    positions: [
      { name: "Passado", hint: "O que trouxe você até aqui." },
      { name: "Presente", hint: "Onde você está agora." },
      { name: "Futuro", hint: "Uma possibilidade, se o rumo atual continuar." },
    ],
  },
  {
    id: "situacao-obstaculo-conselho",
    name: "Situação, Obstáculo e Conselho",
    description: "Três cartas para olhar uma situação, o que a dificulta e uma sugestão de caminho.",
    positions: [
      { name: "Situação", hint: "O panorama do momento." },
      { name: "Obstáculo", hint: "O que dificulta ou precisa de atenção." },
      { name: "Conselho", hint: "Uma orientação para refletir." },
    ],
  },
  {
    id: "cruz-celta",
    name: "Cruz Celta",
    description: "Dez cartas para uma visão ampla e profunda de uma situação.",
    positions: [
      { name: "1. Presente", hint: "O coração da situação." },
      { name: "2. Desafio", hint: "O que cruza o caminho." },
      { name: "3. Base", hint: "As raízes, o que sustenta a situação." },
      { name: "4. Passado recente", hint: "O que acabou de acontecer." },
      { name: "5. Coroa", hint: "O que você almeja ou tem consciência." },
      { name: "6. Futuro próximo", hint: "O que se aproxima." },
      { name: "7. Você", hint: "Sua atitude e como você se vê." },
      { name: "8. Ambiente", hint: "Influências externas e pessoas ao redor." },
      { name: "9. Esperanças e medos", hint: "O que você deseja e teme." },
      { name: "10. Resultado possível", hint: "Aonde o conjunto pode levar." },
    ],
  },
];

const BY_ID = new Map(SPREADS.map((s) => [s.id, s]));

export function getSpread(id: string): Spread | undefined {
  return BY_ID.get(id as SpreadId);
}

export function isSpreadId(id: unknown): id is SpreadId {
  return typeof id === "string" && BY_ID.has(id as SpreadId);
}
