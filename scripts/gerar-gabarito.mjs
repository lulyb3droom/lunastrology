// Gera tests/fixtures/mapas-referencia.json usando o Swiss Ephemeris (pacote "sweph").
// FERRAMENTA DE DESENVOLVIMENTO: o Swiss Ephemeris é AGPL e NÃO faz parte do site.
// Uso: SWEPH_DIR=<pasta onde o sweph foi instalado> node scripts/gerar-gabarito.mjs <casos-utc.json>
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = process.env.SWEPH_DIR;
if (!dir) throw new Error("Defina SWEPH_DIR (pasta com node_modules/sweph).");
const sweph = createRequire(path.join(dir, "package.json"))("sweph");
const c = sweph.constants;
const FLAGS = c.SEFLG_MOSEPH | c.SEFLG_SPEED; // Moshier: sem arquivos de dados; precisão sub-segundo-de-arco

const BODIES = {
  sun: c.SE_SUN, moon: c.SE_MOON, mercury: c.SE_MERCURY, venus: c.SE_VENUS, mars: c.SE_MARS,
  jupiter: c.SE_JUPITER, saturn: c.SE_SATURN, uranus: c.SE_URANUS, neptune: c.SE_NEPTUNE, pluto: c.SE_PLUTO,
};
const norm = (x) => ((x % 360) + 360) % 360;

const casos = JSON.parse(readFileSync(process.argv[2], "utf8"));
const saida = casos.map((caso) => {
  const d = new Date(caso.utc);
  const jd = sweph.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
    d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600, c.SE_GREG_CAL);

  const planets = {};
  for (const [nome, id] of Object.entries(BODIES)) {
    const r = sweph.calc_ut(jd, id, FLAGS);
    planets[nome] = { lon: r.data[0], speed: r.data[3] };
  }
  const node = sweph.calc_ut(jd, c.SE_MEAN_NODE, FLAGS).data;
  const lilith = sweph.calc_ut(jd, c.SE_MEAN_APOG, FLAGS).data;

  const out = {
    id: caso.id, label: caso.label, grupo: caso.grupo,
    input: { date: caso.date, time: caso.time, tz: caso.tz, lat: caso.lat, lon: caso.lon, timeUnknown: !!caso.timeUnknown },
    utc: caso.utc, offsetMin: caso.offsetMin, jdUt: jd,
    planets,
    meanNode: { lon: node[0], speed: node[3] },
    meanApogee: { lon: lilith[0], speed: lilith[3] },
  };

  if (!caso.timeUnknown) {
    const house = (sys) => {
      const r = sweph.houses(jd, caso.lat, caso.lon, sys);
      return { ok: !r.error && r.flag === 0, cusps: r.data.houses, points: r.data.points };
    };
    const P = house("P"), K = house("K"), E = house("E"), W = house("W");
    out.asc = P.points[0];
    out.mc = P.points[1];
    out.armc = P.points[2];
    out.houses = {
      placidus: P.ok ? P.cusps : null,
      koch: K.ok ? K.cusps : null,
      equal: E.cusps,
      whole: W.cusps,
    };
    // Parte da Fortuna: dia (Sol acima do horizonte) = ASC + Lua - Sol; noite = ASC + Sol - Lua
    const sun = planets.sun.lon, moon = planets.moon.lon;
    const diurno = norm(sun - out.asc) >= 180;
    out.partOfFortune = norm(diurno ? out.asc + moon - sun : out.asc + sun - moon);
    out.diurno = diurno;
  }
  return out;
});

writeFileSync("tests/fixtures/mapas-referencia.json", JSON.stringify({
  fonte: `Swiss Ephemeris ${sweph.version()} (Moshier), via pacote sweph. Gerado por scripts/gerar-gabarito.mjs`,
  mapas: saida,
}, null, 1));
console.log("mapas:", saida.length);
