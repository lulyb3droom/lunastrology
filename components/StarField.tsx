// Fundo do site: campo de estrelas (SVG gerado de forma determinística) + 3 nebulosas.
// Sem canvas e sem JavaScript no navegador: é leve e funciona no celular.

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function makeStars(count: number, seed: number) {
  const rnd = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: +(rnd() * 100).toFixed(2),
    y: +(rnd() * 100).toFixed(2),
    r: +(0.12 + rnd() * 0.28).toFixed(2),
    o: +(0.25 + rnd() * 0.6).toFixed(2),
  }));
}

const STARS_A = makeStars(90, 7);
const STARS_B = makeStars(45, 99);

function Layer({ stars, className }: { stars: typeof STARS_A; className?: string }) {
  return (
    <svg
      className={`sky-stars ${className ?? ""}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="currentColor" opacity={s.o} />
      ))}
    </svg>
  );
}

export function StarField() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-nebula sky-nebula-1" />
      <div className="sky-nebula sky-nebula-2" />
      <div className="sky-nebula sky-nebula-3" />
      <Layer stars={STARS_A} />
      <Layer stars={STARS_B} className="sky-stars-twinkle" />
    </div>
  );
}
