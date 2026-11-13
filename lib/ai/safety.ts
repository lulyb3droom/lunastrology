/**
 * Filtro de segurança, ANTES de qualquer sorteio ou chamada de IA.
 * Se a pergunta sugere sofrimento grave ou risco à vida, não fazemos a tiragem:
 * respondemos com acolhimento e indicamos o CVV (188).
 *
 * É um filtro determinístico (lista de expressões em português): pega os casos mais claros,
 * mas NÃO pega todos. Por isso o prompt da IA também tem uma regra de acolhimento (segunda camada).
 */

export const CVV_PHONE = "188";
export const CVV_SITE = "https://cvv.org.br";

export const CRISIS_MESSAGE =
  "Sinto muito que você esteja passando por um momento tão difícil. Você não está sozinha(o), e sua vida importa. " +
  "Neste momento, conversar com alguém pode ajudar: o CVV (Centro de Valorização da Vida) atende 24 horas, de graça e " +
  "com sigilo, pelo telefone 188 ou pelo chat em cvv.org.br. Se houver risco imediato, ligue para o SAMU (192) ou vá ao " +
  "pronto-socorro mais próximo. Por isso, vamos deixar o tarot de lado agora: cuidar de você vem primeiro.";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Expressões comuns que usam "matar"/"morrer" em sentido figurado. São removidas ANTES da checagem,
// para não dar alarme falso (ex.: "vou me matar de rir", "morrendo de saudade", "matar a saudade").
const IDIOMS =
  /\b(me matar|matar|matando|morrer|morrendo|morri|morreu|morro|mata|matou) (de|a|o|as|os) (rir|riso|trabalhar|estudar|vergonha|saudade|saudades|fome|sede|sono|medo|calor|frio|inveja|raiva|cansaco|curiosidade|vontade|aula|tempo|pressa|dor de cabeca)\b/g;

// Escritas sem acento e sem pontuação (o texto é normalizado antes).
const PATTERNS: RegExp[] = [
  /\bsuicid/, // suicídio, suicidar
  /\b(vou|quero|queria|pensando em|penso em|pensei em|vontade de|desejo de) (me matar|morrer|sumir de vez|acabar com (tudo|a minha vida|minha vida|a vida))\b/,
  /\bme matar\b/,
  /\bnao (quero|queria|aguento|suporto|consigo) mais (viver|existir|continuar vivo|continuar viva)\b/,
  /\b(tirar|acabar com|por fim (a|na)|dar um fim (a|na)) (a )?(minha|propria) vida\b/,
  /\b(melhor|seria melhor) (se )?(eu )?(nao (estivesse|existisse|nascesse)|morresse|sumisse)\b/,
  /\b(todos|todo mundo|todo o mundo|o mundo|minha familia) (ficaria|ficariam|estaria|estariam) melhor sem mim\b/,
  /\bnao (tenho|vejo) (mais )?(motivo|razao|sentido|saida) (para|pra|em) (viver|continuar)\b/,
  /\b(me cortar|me machucar|me ferir|me automutilar|automutilacao|autolesao)\b/,
  /\b(tomar|engolir) (todos )?(os )?(remedios|comprimidos) (para|pra) (morrer|acabar)\b/,
  /\bquero (morrer|desaparecer para sempre|dormir e nunca mais acordar)\b/,
  /\bnunca mais acordar\b/,
];

/** true se o texto sugere risco à vida ou sofrimento grave. */
export function detectCrisis(text: string): boolean {
  if (!text) return false;
  const n = normalize(text).replace(IDIOMS, " ");
  return PATTERNS.some((p) => p.test(n));
}
