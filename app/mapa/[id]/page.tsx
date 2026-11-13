import type { Metadata } from "next";
import Link from "next/link";
import { CALC_VERSION, calculateChart, type HouseSystem } from "@/lib/astro";
import { ChartView } from "@/components/chart/ChartView";
import { AiInterpretation } from "@/components/ai/AiInterpretation";
import { Glass } from "@/components/Glass";
import { HOUSE_SYSTEMS, HOUSE_SYSTEM_LABELS } from "@/lib/charts/house-systems";
import { getChartForVisitor } from "@/lib/charts/repo";

export const metadata: Metadata = {
  title: "Seu mapa astral",
  robots: { index: false, follow: false }, // mapas são pessoais: não vão para o Google
};

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export default async function MapaResultado({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ casas?: string; hora?: string }>;
}) {
  const { id } = await params;
  const { casas, hora } = await searchParams;
  const stored = await getChartForVisitor(id);

  if (!stored) {
    return (
      <Glass variant="strong" className="mx-auto max-w-xl p-6 text-center sm:p-10">
        <h1 className="font-display text-3xl">Mapa não encontrado</h1>
        <p className="mt-3">
          Este mapa não está disponível neste navegador. Por privacidade, os mapas ficam visíveis só para quem os
          calculou, no mesmo navegador, por até 30 dias.
        </p>
        <Link
          href="/mapa"
          className="mt-6 inline-block rounded-lg bg-neon-nebula px-5 py-3 font-semibold text-bg-deep"
        >
          Calcular um mapa
        </Link>
      </Glass>
    );
  }

  const requested = HOUSE_SYSTEMS.includes(casas as HouseSystem) ? (casas as HouseSystem) : stored.houseSystem;
  // Recalcula na hora (é barato) se o usuário trocou o sistema de casas ou se o algoritmo evoluiu desde que o mapa foi salvo.
  // Hora ambígua (fim do horário de verão): a pessoa pode escolher a 2ª ocorrência.
  const second = hora === "segunda";
  const needsRecalc = requested !== stored.houseSystem || stored.calcVersion !== CALC_VERSION || second;
  const chart = needsRecalc
    ? calculateChart({
        ...stored.result.input,
        houseSystem: requested,
        ambiguousChoice: second ? "second" : (stored.result.input.ambiguousChoice ?? "first"),
      })
    : stored.result;
  const casasQuery = requested !== stored.houseSystem ? `casas=${requested}` : "";
  const ambiguousLink = (choice: "primeira" | "segunda") =>
    `/mapa/${stored.id}?${[casasQuery, choice === "segunda" ? "hora=segunda" : ""].filter(Boolean).join("&")}`;

  const title = stored.label ? `Mapa astral de ${stored.label}` : "Seu mapa astral";
  const when = stored.timeUnknown
    ? `${formatDateBR(stored.birthLocalDate)} · hora desconhecida`
    : `${formatDateBR(stored.birthLocalDate)} às ${stored.birthLocalTime}`;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="text-lg text-text-main/90">
          {when} · {stored.placeName}
        </p>
        <p className="text-sm text-text-main/80">
          {stored.timeUnknown ? "Calculado para 12:00 locais" : "Hora local"} = {chart.instant.utcIso.slice(11, 16)} UTC (
          {formatOffset(chart.instant.offsetMinutes)}, fuso {stored.tz}). Zodíaco tropical, posições geocêntricas aparentes.
        </p>
      </header>

      {chart.warnings.length > 0 && (
        <Glass variant="subtle" className="space-y-2 p-4" as="section">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neon-nebula">Atenção</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {chart.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {chart.instant.status === "ambiguous" && (
            <p className="text-sm">
              Ver com:{" "}
              <Link href={ambiguousLink("primeira")} className="text-neon-nebula underline underline-offset-4">
                1ª ocorrência (horário de verão)
              </Link>{" "}
              ·{" "}
              <Link href={ambiguousLink("segunda")} className="text-neon-nebula underline underline-offset-4">
                2ª ocorrência (depois do fim do horário de verão)
              </Link>
              . Agora: {second ? "2ª" : "1ª"}.
            </p>
          )}
        </Glass>
      )}

      {!stored.timeUnknown && (
        <nav aria-label="Sistema de casas" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Casas:</span>
          {HOUSE_SYSTEMS.map((s) => {
            const current = (chart.houseSystemUsed ?? requested) === s;
            return (
              <Link
                key={s}
                href={`/mapa/${stored.id}?casas=${s}${second ? "&hora=segunda" : ""}`}
                aria-current={current ? "page" : undefined}
                className={`rounded-full border px-3 py-1 ${current ? "border-neon-nebula bg-neon-nebula text-bg-deep font-semibold" : "border-white-cosmic/25 hover:border-neon-nebula"}`}
              >
                {HOUSE_SYSTEM_LABELS[s]}
              </Link>
            );
          })}
        </nav>
      )}

      <AiInterpretation
        endpoint={`/api/mapa/${stored.id}/interpretar`}
        initialText={stored.interpretation}
        title="Interpretação do mapa"
        startLabel="Interpretar meu mapa com IA"
        note={`Baseada no mapa original (${HOUSE_SYSTEM_LABELS[stored.houseSystem]}${stored.timeUnknown ? ", sem hora de nascimento" : ""}).`}
      />

      <ChartView chart={chart} />

      <p className="text-sm">
        <Link href="/mapa" className="text-neon-nebula underline underline-offset-4">
          Calcular outro mapa
        </Link>
      </p>
    </div>
  );
}
