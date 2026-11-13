import type { Metadata } from "next";
import { Glass } from "@/components/Glass";
import { SpreadPicker } from "@/components/tarot/SpreadPicker";

export const metadata: Metadata = {
  title: "Tarot",
  description: "Faça uma tiragem de tarot: carta do dia, três cartas ou Cruz Celta, com o baralho Rider-Waite-Smith.",
};

export default function TarotPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">Tarot</h1>
        <p className="mt-3 text-lg text-text-main/90">
          Escolha uma tiragem. As cartas são sorteadas de verdade no servidor, e cada uma vem com seu significado para
          você refletir. O tarot é uma ferramenta de autoconhecimento, não uma previsão do futuro.
        </p>
      </header>
      <Glass variant="strong" className="p-5 sm:p-8">
        <SpreadPicker />
      </Glass>
    </div>
  );
}
