import type { Metadata } from "next";
import { BirthForm } from "@/components/birth/BirthForm";
import { Glass } from "@/components/Glass";

export const metadata: Metadata = {
  title: "Calcular mapa astral",
  description: "Informe data, hora e cidade de nascimento para calcular seu mapa astral com precisão astronômica.",
};

export default function MapaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">Calcular mapa astral</h1>
        <p className="mt-3 text-lg text-text-main/90">
          Informe os dados do nascimento. O cálculo usa as posições reais dos astros e as regras de fuso horário da
          época, inclusive o horário de verão brasileiro.
        </p>
      </header>
      <Glass variant="strong" className="p-5 sm:p-8">
        <BirthForm />
      </Glass>
    </div>
  );
}
