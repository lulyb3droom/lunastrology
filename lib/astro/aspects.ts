import { ASPECTS, type AspectConfig } from "./config";
import { angularDistance } from "./math";
import type { Aspect, BodyId } from "./types";

export interface AspectBody {
  id: BodyId;
  longitude: number;
  /** graus por dia; null para ASC/MC (sem aplicativo/separativo) */
  speed: number | null;
}

const LUMINARIES: BodyId[] = ["sun", "moon"];
const ANGLES: BodyId[] = ["asc", "mc"];

export interface AspectOptions {
  /** inclui aspectos desativados por padrão (ex.: quincúncio) */
  includeAll?: boolean;
  /** substitui a lista de aspectos de config.ts (útil em testes) */
  aspects?: readonly AspectConfig[];
}

/**
 * Aspectos entre todos os pares de corpos.
 * Aplicativo = os corpos estão se aproximando do aspecto exato; separativo = já passaram dele.
 */
export function computeAspects(bodies: AspectBody[], options: AspectOptions = {}): Aspect[] {
  const configs = (options.aspects ?? ASPECTS).filter((a) => a.enabled || options.includeAll);
  const result: Aspect[] = [];

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]!;
      const b = bodies[j]!;
      // Aspecto entre ASC e MC é só geometria do mapa; não é informativo.
      if (ANGLES.includes(a.id) && ANGLES.includes(b.id)) continue;

      const distance = angularDistance(a.longitude, b.longitude);
      const luminary = LUMINARIES.includes(a.id) || LUMINARIES.includes(b.id);

      for (const cfg of configs) {
        const maxOrb = luminary ? cfg.luminaryOrb : cfg.orb;
        const orb = Math.abs(distance - cfg.angle);
        if (orb > maxOrb) continue;

        let applying: boolean | null = null;
        if (a.speed !== null && b.speed !== null) {
          const dt = 0.01; // dias
          const later = angularDistance(a.longitude + a.speed * dt, b.longitude + b.speed * dt);
          applying = Math.abs(later - cfg.angle) < orb;
        }
        result.push({ a: a.id, b: b.id, type: cfg.type, angle: cfg.angle, orb, applying });
        break; // um par só forma um aspecto
      }
    }
  }
  return result.sort((x, y) => x.orb - y.orb);
}
