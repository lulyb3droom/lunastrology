export const DEG = Math.PI / 180;

export const rad = (d: number) => d * DEG;
export const deg = (r: number) => r / DEG;

/** Normaliza para [0, 360). */
export const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Normaliza para (-180, 180]. */
export const norm180 = (x: number) => {
  const n = norm360(x);
  return n > 180 ? n - 360 : n;
};

/** Menor distância angular (0 a 180) entre duas longitudes. */
export const angularDistance = (a: number, b: number) => Math.abs(norm180(a - b));
