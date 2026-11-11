"use client";

import { useState } from "react";
import type { Aspect, AspectType, BodyId, ChartResult, Element, PlacedPoint } from "@/lib/astro";
import { ASPECT_NAMES, BODY_NAMES, formatDegMin, formatOrb } from "@/lib/astro";
import { Glass } from "@/components/Glass";
import { ChartWheel } from "./ChartWheel";
import { ASPECT_STYLE, BODY_GLYPHS, SIGN_GLYPHS } from "./symbols";

const TABLE_ORDER: BodyId[] = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
  "northNode", "southNode", "lilith", "partOfFortune", "asc", "mc",
];

const ELEMENT_LABEL: Record<Element, string> = { fogo: "Fogo", terra: "Terra", ar: "Ar", água: "Água" };

const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-main/80";
const td = "px-3 py-2 align-middle";

function Sign({ p }: { p: { signIndex: number; signName: string } }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-astro mr-1 text-lg" aria-hidden="true">
        {SIGN_GLYPHS[p.signIndex]}
      </span>
      {p.signName}
    </span>
  );
}

function Movement({ id, p }: { id: BodyId; p: PlacedPoint }) {
  if (id === "northNode" || id === "southNode" || p.speed === null) return <span aria-label="não se aplica">—</span>;
  return p.retrograde ? (
    <span className="font-semibold text-neon-nebula">Retrógrado</span>
  ) : (
    <span>Direto</span>
  );
}

function AspectSample({ type }: { type: AspectType }) {
  const s = ASPECT_STYLE[type];
  return (
    <svg width="44" height="10" viewBox="0 0 44 10" aria-hidden="true" className="shrink-0">
      <line x1="2" y1="5" x2="42" y2="5" className={s.stroke} strokeWidth={s.width + 0.6} strokeDasharray={s.dash} />
    </svg>
  );
}

export function ChartView({ chart }: { chart: ChartResult }) {
  const [selected, setSelected] = useState<BodyId | null>(null);
  const toggle = (id: BodyId) => setSelected((cur) => (cur === id ? null : id));
  const { bigThree } = chart.summary;
  const hasHouses = !!chart.cusps;

  const shownTypes = Array.from(new Set(chart.aspects.map((a) => a.type)));
  const legendTypes: AspectType[] = (["conjunction", "sextile", "square", "trine", "opposition", "quincunx"] as const).filter(
    (t) => shownTypes.includes(t),
  );

  const selPoint = selected ? chart.bodies[selected] : undefined;
  const selAspects: Aspect[] = selected ? chart.aspects.filter((a) => a.a === selected || a.b === selected) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
        <Glass className="p-3 sm:p-5">
          <ChartWheel chart={chart} selected={selected} onSelect={setSelected} />
        </Glass>

        <div className="space-y-6">
          <Glass className="p-5">
            <h2 className="font-display text-2xl">Big Three</h2>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["sun", "Sol", bigThree.sun],
                  ["moon", "Lua", bigThree.moon],
                  ["asc", "Ascendente", bigThree.asc],
                ] as const
              ).map(([id, label, p]) => (
                <div key={id} className="rounded-lg border border-white-cosmic/10 px-1 py-3">
                  <dt className="text-xs uppercase tracking-wide text-text-main/80">{label}</dt>
                  <dd className="mt-1">
                    {p ? (
                      <>
                        <span className="font-astro block text-3xl" aria-hidden="true">
                          {SIGN_GLYPHS[p.signIndex]}
                        </span>
                        <span className="block text-sm font-semibold">{p.signName}</span>
                        <span className="block text-xs text-text-main/80">{formatDegMin(p)}</span>
                      </>
                    ) : (
                      <span className="block px-1 text-xs text-text-main/80">precisa da hora de nascimento</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {chart.summary.chartRuler && (
              <p className="mt-4 text-sm text-text-main/90">
                Regente do mapa: <b>{BODY_NAMES[chart.summary.chartRuler.modern]}</b>
                {chart.summary.chartRuler.modern !== chart.summary.chartRuler.traditional && (
                  <> (tradicional: {BODY_NAMES[chart.summary.chartRuler.traditional]})</>
                )}
                .
              </p>
            )}
          </Glass>

          <Glass className="p-5" as="section">
            <h2 className="font-display text-2xl">Legenda dos aspectos</h2>
            {legendTypes.length === 0 ? (
              <p className="mt-2 text-sm">Nenhum aspecto dentro do orbe.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {legendTypes.map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <AspectSample type={t} />
                    <span>
                      {ASPECT_NAMES[t]} <span className="text-text-main/70">({ASPECT_STYLE[t].family})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-text-main/70">
              Toque em um planeta na roda (ou na tabela) para destacar os aspectos dele.
            </p>
          </Glass>

          <Glass className="p-5" as="section">
            <h2 className="font-display text-2xl">Selecionado</h2>
            <div aria-live="polite" className="mt-2 text-sm">
              {selected && selPoint ? (
                <>
                  <p>
                    <span className="font-astro mr-1 text-lg" aria-hidden="true">
                      {BODY_GLYPHS[selected]}
                    </span>
                    <b>{BODY_NAMES[selected]}</b> a {formatDegMin(selPoint)} de {selPoint.signName}
                    {selPoint.house ? `, casa ${selPoint.house}` : ""}.
                  </p>
                  {selAspects.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {selAspects.map((a) => {
                        const other = a.a === selected ? a.b : a.a;
                        return (
                          <li key={`${a.a}-${a.b}`}>
                            {ASPECT_NAMES[a.type]} com {BODY_NAMES[other]} (orbe {formatOrb(a.orb)})
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-text-main/80">Sem aspectos dentro do orbe.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="mt-3 text-neon-nebula underline underline-offset-4"
                  >
                    Limpar seleção
                  </button>
                </>
              ) : (
                <p className="text-text-main/80">Nenhum astro selecionado.</p>
              )}
            </div>
          </Glass>
        </div>
      </div>

      {/* Planetas e pontos */}
      <Glass as="section" className="p-5">
        <h2 className="font-display text-2xl">Planetas e pontos</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">Posição de cada astro no mapa</caption>
            <thead>
              <tr>
                <th className={th} scope="col">Astro</th>
                <th className={th} scope="col">Signo</th>
                <th className={th} scope="col">Posição</th>
                {hasHouses && <th className={th} scope="col">Casa</th>}
                <th className={th} scope="col">Movimento</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ORDER.filter((id) => chart.bodies[id]).map((id) => {
                const p = chart.bodies[id]!;
                const isSel = selected === id;
                return (
                  <tr key={id} className={`border-t border-white-cosmic/10 ${isSel ? "bg-neon-nebula/15" : ""}`}>
                    <th scope="row" className={`${td} text-left font-normal`}>
                      {id === "asc" || id === "mc" ? (
                        <span>{BODY_NAMES[id]}</span>
                      ) : (
                        <button
                          type="button"
                          aria-pressed={isSel}
                          onClick={() => toggle(id)}
                          className="text-left hover:text-neon-nebula"
                        >
                          <span className="font-astro mr-2 inline-block w-6 text-center text-lg" aria-hidden="true">
                            {BODY_GLYPHS[id]}
                          </span>
                          {BODY_NAMES[id]}
                        </button>
                      )}
                    </th>
                    <td className={td}><Sign p={p} /></td>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>{formatDegMin(p)}</td>
                    {hasHouses && (
                      <td className={td}>{p.house ?? "—"}</td>
                    )}
                    <td className={td}><Movement id={id} p={p} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!hasHouses && (
          <p className="mt-3 text-xs text-text-main/70">
            Sem a hora de nascimento, o Ascendente, o Meio do Céu, as casas e a Parte da Fortuna não podem ser calculados.
          </p>
        )}
      </Glass>

      {/* Casas */}
      {hasHouses && (
        <Glass as="section" className="p-5">
          <h2 className="font-display text-2xl">Casas</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Cúspide de cada casa</caption>
              <thead>
                <tr>
                  <th className={th} scope="col">Casa</th>
                  <th className={th} scope="col">Cúspide</th>
                  <th className={th} scope="col">Signo</th>
                </tr>
              </thead>
              <tbody>
                {chart.cusps!.map((c) => (
                  <tr key={c.house} className="border-t border-white-cosmic/10">
                    <th scope="row" className={`${td} text-left font-normal`}>{c.house}</th>
                    <td className={`${td} tabular-nums`}>{formatDegMin(c)}</td>
                    <td className={td}><Sign p={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Glass>
      )}

      {/* Aspectos */}
      <Glass as="section" className="p-5">
        <h2 className="font-display text-2xl">Aspectos</h2>
        {chart.aspects.length === 0 ? (
          <p className="mt-2 text-sm">Nenhum aspecto dentro do orbe.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <caption className="sr-only">Aspectos entre os astros, do mais exato ao menos exato</caption>
              <thead>
                <tr>
                  <th className={th} scope="col">Astro</th>
                  <th className={th} scope="col">Aspecto</th>
                  <th className={th} scope="col">Astro</th>
                  <th className={th} scope="col">Orbe</th>
                  <th className={th} scope="col">Fase</th>
                </tr>
              </thead>
              <tbody>
                {chart.aspects.map((a) => (
                  <tr key={`${a.a}-${a.b}`} className="border-t border-white-cosmic/10">
                    <td className={td}>
                      <span className="font-astro mr-1" aria-hidden="true">{BODY_GLYPHS[a.a]}</span>
                      {BODY_NAMES[a.a]}
                    </td>
                    <td className={td}>
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <AspectSample type={a.type} />
                        {ASPECT_NAMES[a.type]}
                      </span>
                    </td>
                    <td className={td}>
                      <span className="font-astro mr-1" aria-hidden="true">{BODY_GLYPHS[a.b]}</span>
                      {BODY_NAMES[a.b]}
                    </td>
                    <td className={`${td} tabular-nums`}>{formatOrb(a.orb)}</td>
                    <td className={td}>
                      {a.applying === null ? "—" : a.applying ? "Aplicativo" : "Separativo"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Glass>

      {/* Elementos e modalidades */}
      <Glass as="section" className="p-5">
        <h2 className="font-display text-2xl">Elementos e modalidades</h2>
        <p className="mt-1 text-sm text-text-main/80">
          Contagem dos 10 planetas (Sol a Plutão). Predominam: <b>{ELEMENT_LABEL[chart.summary.dominantElement]}</b> e{" "}
          <b>{chart.summary.dominantModality}</b>.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <Bars title="Elementos" entries={(Object.keys(chart.summary.elements) as Element[]).map((k) => [ELEMENT_LABEL[k], chart.summary.elements[k]])} />
          <Bars
            title="Modalidades"
            entries={(Object.keys(chart.summary.modalities) as (keyof typeof chart.summary.modalities)[]).map((k) => [
              k.charAt(0).toUpperCase() + k.slice(1),
              chart.summary.modalities[k],
            ])}
          />
        </div>
      </Glass>
    </div>
  );
}

function Bars({ title, entries }: { title: string; entries: [string, number][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2">
        {entries.map(([label, n]) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0">{label}</span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-bg-deep/70" aria-hidden="true">
              <span className="block h-full rounded-full bg-violet-astral" style={{ width: `${(n / 10) * 100}%` }} />
            </span>
            <span className="w-5 text-right tabular-nums">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

