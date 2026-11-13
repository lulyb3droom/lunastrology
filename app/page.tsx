import Image from "next/image";
import Link from "next/link";
import { getCard } from "@/data/tarot/cartas";
import { Glass } from "@/components/Glass";
import { DailyCardButton } from "@/components/tarot/DailyCardButton";
import { getTodaysReading } from "@/lib/tarot/daily";

export default async function Home() {
  // Falha no banco não pode derrubar a Home: sem a carta do dia, mostra o botão.
  const today = await getTodaysReading().catch(() => null);
  const drawn = today?.cards[0];
  const card = drawn ? getCard(drawn.cardId) : undefined;

  return (
    <div className="space-y-6">
      <Glass variant="strong" className="p-6 sm:p-10">
        <h1 className="font-display text-4xl sm:text-5xl">Seu céu, calculado de verdade</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-main/90">
          Mapa astral com precisão astronômica e tiragens de tarot para refletir sobre o seu caminho.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/mapa"
            className="inline-block rounded-lg bg-neon-nebula px-6 py-3 font-semibold text-bg-deep transition hover:shadow-[0_0_18px_var(--color-neon-nebula)]"
          >
            Calcular meu mapa astral
          </Link>
          <Link
            href="/tarot"
            className="inline-block rounded-lg border border-white-cosmic/30 px-6 py-3 font-semibold transition hover:border-neon-nebula"
          >
            Fazer uma tiragem de tarot
          </Link>
        </div>
      </Glass>

      <Glass className="p-6 sm:p-8" as="section">
        <h2 className="font-display text-3xl">Carta do dia</h2>
        {today && drawn && card ? (
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            <Link href={`/tarot/${today.id}`} className="shrink-0 self-center sm:self-start" aria-label={`Abrir a carta do dia: ${card.name}`}>
              <Image
                src={`/tarot/${card.id}.webp`}
                alt={`${card.name}${drawn.reversed ? " (invertida)" : ""}`}
                width={420}
                height={727}
                unoptimized
                className="w-40 rounded-lg shadow-[0_0_16px_var(--color-violet-astral)]"
                style={drawn.reversed ? { transform: "rotate(180deg)" } : undefined}
              />
            </Link>
            <div>
              <h3 className="font-display text-2xl">
                {card.name}
                {drawn.reversed && <span className="ml-2 text-base text-text-main/80">(invertida)</span>}
              </h3>
              <p className="mt-1 text-sm text-text-main/80">{card.keywords.join(" · ")}</p>
              <p className="mt-3">{drawn.reversed ? card.reversed : card.upright}</p>
              <p className="mt-3 text-sm text-text-main/80">Volte amanhã para uma nova carta.</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="max-w-2xl text-text-main/90">
              Tire uma carta para refletir sobre o seu dia. É uma por dia: respire, e deixe o baralho escolher.
            </p>
            <DailyCardButton />
          </div>
        )}
      </Glass>
    </div>
  );
}
