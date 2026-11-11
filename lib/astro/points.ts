import { norm360, rad } from "./math";

/** Longitude do Nodo Norte lunar MÉDIO (Meeus, cap. 47), em graus. T = séculos julianos TT desde J2000. */
export function meanNorthNode(T: number): number {
  return norm360(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T ** 2 + T ** 3 / 467441 - T ** 4 / 60616000,
  );
}

/**
 * Longitude da Lilith MÉDIA (apogeu médio da Lua), em graus.
 *
 * Base: perigeu médio de Meeus + 180°. A isso soma-se a correção periódica de 2(apogeu - nodo)
 * (≈ 0,1157°), que é como o Swiss Ephemeris (e portanto o Astro.com) define a Lilith média.
 * Sem ela, a diferença chega a ~7'. Com ela, o erro fica abaixo de 0,35' entre os anos 1800 e 2200
 * (verificado contra o Swiss Ephemeris; coeficiente ajustado por mínimos quadrados).
 */
export function meanLilith(T: number): number {
  const perigee =
    83.3532465 + 4069.0137287 * T - 0.01032 * T ** 2 - T ** 3 / 80053 + T ** 4 / 18999000;
  const apogee = norm360(perigee + 180);
  const node = meanNorthNode(T);
  return norm360(apogee - 0.1157 * Math.sin(rad(2 * (apogee - node))));
}
