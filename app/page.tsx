import { Glass } from "@/components/Glass";

export default function Home() {
  return (
    <section className="space-y-6">
      <Glass variant="strong" className="p-6 sm:p-10">
        <h1 className="font-display text-4xl sm:text-5xl">Seu céu, calculado de verdade</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-main/90">
          Em breve: mapa astral com precisão astronômica e tiragens de tarot interpretadas por IA.
        </p>
      </Glass>
    </section>
  );
}
