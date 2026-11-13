import type { Metadata } from "next";
import Link from "next/link";
import { getCard } from "@/data/tarot/cartas";
import { Glass } from "@/components/Glass";
import { ReadingBoard, type BoardCard } from "@/components/tarot/ReadingBoard";
import { getReadingForVisitor } from "@/lib/tarot/repo";
import { getSpread } from "@/lib/tarot/spreads";

export const metadata: Metadata = {
  title: "Sua tiragem",
  robots: { index: false, follow: false }, // tiragens são pessoais
};

export default async function TiragemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reading = await getReadingForVisitor(id);
  const spread = reading ? getSpread(reading.spread) : undefined;

  if (!reading || !spread) {
    return (
      <Glass variant="strong" className="mx-auto max-w-xl p-6 text-center sm:p-10">
        <h1 className="font-display text-3xl">Tiragem não encontrada</h1>
        <p className="mt-3">
          Esta tiragem não está disponível neste navegador. Por privacidade, ela fica visível só para quem a fez, no mesmo
          navegador.
        </p>
        <Link href="/tarot" className="mt-6 inline-block rounded-lg bg-neon-nebula px-5 py-3 font-semibold text-bg-deep">
          Fazer uma tiragem
        </Link>
      </Glass>
    );
  }

  const cards: BoardCard[] = reading.cards.flatMap((d) => {
    const card = getCard(d.cardId);
    const pos = spread.positions[d.position];
    if (!card || !pos) return [];
    return [
      {
        position: d.position,
        cardId: card.id,
        name: card.name,
        reversed: d.reversed,
        positionName: pos.name,
        positionHint: pos.hint,
        keywords: card.keywords,
        upright: card.upright,
        reversedMeaning: card.reversed,
      },
    ];
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">{spread.name}</h1>
        <p className="mt-2 text-text-main/90">{spread.description}</p>
      </header>

      <ReadingBoard spreadId={spread.id} spreadName={spread.name} cards={cards} />

      <p className="text-xs text-text-main/70">
        Imagens: baralho Rider-Waite-Smith (1909, ilustrações de Pamela Colman Smith), em domínio público, via Wikimedia
        Commons. As cartas são sorteadas no servidor com aleatoriedade criptográfica. Tarot é para entretenimento e
        autoconhecimento.
      </p>
    </div>
  );
}
