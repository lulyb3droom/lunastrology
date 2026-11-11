import { norm360 } from "@/lib/astro/math";

export const SIZE = 600;
export const CENTER = SIZE / 2;

// Raios (em unidades do viewBox 600x600)
export const R_OUT = 280; // borda externa do anel dos signos
export const R_SIGN_IN = 236; // borda interna do anel dos signos
export const R_PLANET = 196; // onde ficam os glifos dos planetas
export const R_HOUSE_NUM = 148; // números das casas
export const R_ASPECT = 128; // círculo interno onde ligam as linhas de aspecto

/**
 * Ângulo na tela (graus, sentido horário a partir da direita, como o SVG usa) de uma longitude.
 * O Ascendente fica à ESQUERDA e o zodíaco avança no sentido anti-horário (convenção astrológica).
 * Sem Ascendente (hora desconhecida), usa 0° de Áries à esquerda.
 */
export function screenAngle(longitude: number, ascendant: number): number {
  // ângulo "matemático" (anti-horário a partir da direita) = 180 + (lon - asc); no SVG o eixo y é invertido.
  return -(180 + (longitude - ascendant));
}

/** Ponto (x, y) no SVG para uma longitude e um raio. */
export function polar(longitude: number, ascendant: number, radius: number) {
  const a = (screenAngle(longitude, ascendant) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(a), y: CENTER + radius * Math.sin(a) };
}

/**
 * Afasta glifos que ficariam sobrepostos. Cada item mantém a ordem e se desloca o mínimo
 * necessário para ficar a pelo menos `minSep` graus do vizinho. Devolve id → longitude de desenho.
 */
export function spreadLongitudes(
  items: { id: string; longitude: number }[],
  minSep = 9,
): Map<string, number> {
  const n = items.length;
  const sorted = [...items].sort((a, b) => a.longitude - b.longitude);
  const pos = sorted.map((i) => i.longitude);
  if (n * minSep >= 360) return new Map(sorted.map((i) => [i.id, i.longitude]));

  for (let iter = 0; iter < 200; iter++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // Diferença simples (sem módulo): se um glifo ultrapassar o vizinho, o "buraco" fica negativo e é corrigido.
      const gap = i === n - 1 ? pos[0]! + 360 - pos[i]! : pos[j]! - pos[i]!;
      if (n > 1 && gap < minSep - 1e-9) {
        const push = (minSep - gap) / 2;
        pos[i] = pos[i]! - push;
        pos[j] = pos[j]! + push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return new Map(sorted.map((it, i) => [it.id, norm360(pos[i]!)]));
}

/** Caminho SVG de uma fatia de anel (setor) entre dois raios e duas longitudes. */
export function sectorPath(
  fromLon: number,
  toLon: number,
  ascendant: number,
  rInner: number,
  rOuter: number,
): string {
  const a = polar(fromLon, ascendant, rOuter);
  const b = polar(toLon, ascendant, rOuter);
  const c = polar(toLon, ascendant, rInner);
  const d = polar(fromLon, ascendant, rInner);
  const f = (n: number) => n.toFixed(2);
  // O zodíaco avança no sentido anti-horário na tela => sweep-flag 0 no arco externo e 1 no interno.
  return `M ${f(a.x)} ${f(a.y)} A ${rOuter} ${rOuter} 0 0 0 ${f(b.x)} ${f(b.y)} L ${f(c.x)} ${f(c.y)} A ${rInner} ${rInner} 0 0 1 ${f(d.x)} ${f(d.y)} Z`;
}
