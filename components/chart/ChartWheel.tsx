"use client";

import type { BodyId, ChartResult } from "@/lib/astro";
import { BODY_NAMES, SIGNS, formatPosition } from "@/lib/astro";
import {
  CENTER,
  R_ASPECT,
  R_HOUSE_NUM,
  R_OUT,
  R_PLANET,
  R_SIGN_IN,
  SIZE,
  polar,
  sectorPath,
  spreadLongitudes,
} from "./geometry";
import { ASPECT_STYLE, BODY_GLYPHS, SIGN_GLYPHS } from "./symbols";

// Corpos que ganham um glifo na roda (ASC e MC aparecem como linhas com rótulo).
const GLYPH_BODIES: BodyId[] = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
  "northNode", "lilith", "partOfFortune",
];

interface Props {
  chart: ChartResult;
  selected: BodyId | null;
  onSelect: (id: BodyId | null) => void;
}

export function ChartWheel({ chart, selected, onSelect }: Props) {
  const hasHouses = !!chart.cusps;
  const asc = chart.bodies.asc?.longitude ?? 0; // sem hora: 0° de Áries à esquerda
  const p = (lon: number, r: number) => polar(lon, asc, r);
  const f = (n: number) => +n.toFixed(2);

  const placed = GLYPH_BODIES.filter((id) => chart.bodies[id]);
  const drawLon = spreadLongitudes(placed.map((id) => ({ id, longitude: chart.bodies[id]!.longitude })));

  const selectedAspects = selected
    ? new Set(chart.aspects.filter((a) => a.a === selected || a.b === selected))
    : null;

  const summary = [
    `Roda do mapa astral.`,
    `Sol em ${formatPosition(chart.bodies.sun!.longitude)}`,
    `Lua em ${formatPosition(chart.bodies.moon!.longitude)}`,
    chart.bodies.asc ? `Ascendente em ${formatPosition(chart.bodies.asc.longitude)}.` : "Sem hora de nascimento: sem Ascendente.",
    "Os mesmos dados estão nas tabelas abaixo.",
  ].join(" ");

  return (
    <svg
      viewBox={`-26 -26 ${SIZE + 52} ${SIZE + 52}`}
      role="group"
      aria-label={summary}
      className="mx-auto block h-auto w-full max-w-[640px] select-none"
    >
      {/* Fundo do disco */}
      <circle cx={CENTER} cy={CENTER} r={R_OUT} className="fill-bg-deep/70 stroke-white-cosmic/40" strokeWidth={1.2} />

      {/* Anel dos signos */}
      {SIGNS.map((s, i) => (
        <g key={s.id}>
          <path
            d={sectorPath(i * 30, (i + 1) * 30, asc, R_SIGN_IN, R_OUT)}
            className={i % 2 === 0 ? "fill-violet-astral/25 stroke-white-cosmic/30" : "fill-bg-cosmic/70 stroke-white-cosmic/30"}
            strokeWidth={0.8}
          />
          <text
            x={f(p(i * 30 + 15, (R_OUT + R_SIGN_IN) / 2).x)}
            y={f(p(i * 30 + 15, (R_OUT + R_SIGN_IN) / 2).y)}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-astro fill-text-main"
            fontSize={22}
          >
            <title>{`${s.name} (${s.element}, ${s.modality})`}</title>
            {SIGN_GLYPHS[i]}
          </text>
        </g>
      ))}

      {/* Marcas de grau (a cada 5°) */}
      {Array.from({ length: 72 }, (_, i) => {
        const lon = i * 5;
        const a = p(lon, R_SIGN_IN);
        const b = p(lon, R_SIGN_IN - (lon % 10 === 0 ? 8 : 5));
        return <line key={lon} x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} className="stroke-white-cosmic/50" strokeWidth={0.7} />;
      })}

      <circle cx={CENTER} cy={CENTER} r={R_SIGN_IN} fill="none" className="stroke-white-cosmic/40" strokeWidth={1} />
      <circle cx={CENTER} cy={CENTER} r={R_ASPECT} fill="none" className="stroke-violet-astral/70" strokeWidth={1} />

      {/* Casas */}
      {hasHouses &&
        chart.cusps!.map((c, i) => {
          const angle = i === 0 || i === 3 || i === 6 || i === 9;
          const a = p(c.longitude, angle ? R_OUT : R_SIGN_IN);
          const b = p(c.longitude, R_ASPECT);
          const next = chart.cusps![(i + 1) % 12]!;
          const span = ((next.longitude - c.longitude + 360) % 360) || 360;
          const mid = p(c.longitude + span / 2, R_HOUSE_NUM);
          return (
            <g key={c.house}>
              <line
                x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)}
                className={angle ? "stroke-text-main" : "stroke-violet-astral/80"}
                strokeWidth={angle ? 1.6 : 1}
              />
              <text
                x={f(mid.x)} y={f(mid.y)} textAnchor="middle" dominantBaseline="central"
                className="fill-text-main/80" fontSize={14}
              >
                {c.house}
              </text>
            </g>
          );
        })}

      {/* Rótulos dos eixos ASC e MC */}
      {hasHouses &&
        (["asc", "mc"] as const).map((id) => {
          const b = chart.bodies[id]!;
          const pos = p(b.longitude, R_OUT + 14);
          return (
            <text
              key={id} x={f(pos.x)} y={f(pos.y)} textAnchor="middle" dominantBaseline="central"
              className="fill-text-main" fontSize={13} fontWeight={600}
            >
              <title>{`${BODY_NAMES[id]} em ${formatPosition(b.longitude)}`}</title>
              {BODY_GLYPHS[id]}
            </text>
          );
        })}

      {/* Linhas de aspecto */}
      {chart.aspects.map((a) => {
        const la = chart.bodies[a.a]?.longitude;
        const lb = chart.bodies[a.b]?.longitude;
        if (la === undefined || lb === undefined) return null;
        const s = ASPECT_STYLE[a.type];
        const pa = p(la, R_ASPECT);
        const pb = p(lb, R_ASPECT);
        const dim = selectedAspects && !selectedAspects.has(a);
        const strong = selectedAspects?.has(a);
        return (
          <line
            key={`${a.a}-${a.b}`}
            x1={f(pa.x)} y1={f(pa.y)} x2={f(pb.x)} y2={f(pb.y)}
            className={s.stroke}
            strokeWidth={strong ? s.width + 1.2 : s.width}
            strokeDasharray={s.dash}
            opacity={dim ? 0.12 : strong ? 1 : 0.75}
          />
        );
      })}

      {/* Planetas e pontos */}
      {placed.map((id) => {
        const b = chart.bodies[id]!;
        const dl = drawLon.get(id) ?? b.longitude;
        const g = p(dl, R_PLANET);
        const tickOuter = p(b.longitude, R_SIGN_IN - 8);
        const tickInner = p(b.longitude, R_SIGN_IN - 14);
        const leader = p(dl, R_PLANET + 15);
        const isSel = selected === id;
        const label = `${BODY_NAMES[id]} em ${formatPosition(b.longitude)}${b.house ? `, casa ${b.house}` : ""}${b.retrograde && id !== "northNode" && id !== "southNode" ? ", retrógrado" : ""}`;
        const showR = b.retrograde && id !== "northNode";
        return (
          <g key={id}>
            <line
              x1={f(tickOuter.x)} y1={f(tickOuter.y)} x2={f(tickInner.x)} y2={f(tickInner.y)}
              className={isSel ? "stroke-neon-nebula" : "stroke-text-main"} strokeWidth={1.4}
            />
            {Math.abs(dl - b.longitude) > 0.5 && (
              <line
                x1={f(tickInner.x)} y1={f(tickInner.y)} x2={f(leader.x)} y2={f(leader.y)}
                className="stroke-white-cosmic/35" strokeWidth={0.7}
              />
            )}
            <g
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={label}
              className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-neon-nebula [&:focus-visible>circle]:stroke-2"
              onClick={() => onSelect(isSel ? null : id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(isSel ? null : id);
                }
              }}
            >
              <circle
                cx={f(g.x)} cy={f(g.y)} r={15}
                className={isSel ? "fill-neon-nebula/30 stroke-neon-nebula" : "fill-bg-deep/80 stroke-white-cosmic/30"}
                strokeWidth={isSel ? 2 : 1}
              />
              <text
                x={f(g.x)} y={f(g.y)} textAnchor="middle" dominantBaseline="central"
                className={`font-astro ${isSel ? "fill-neon-nebula" : "fill-text-main"}`}
                fontSize={id === "partOfFortune" ? 20 : 22}
              >
                {BODY_GLYPHS[id]}
              </text>
              {showR && (
                <text
                  x={f(g.x + 13)} y={f(g.y + 11)} className="fill-neon-nebula" fontSize={11} fontWeight={700}
                >
                  R
                </text>
              )}
              <title>{label}</title>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
