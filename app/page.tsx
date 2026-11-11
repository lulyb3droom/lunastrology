import Link from "next/link";
import { Glass } from "@/components/Glass";

export default function Home() {
  return (
    <section className="space-y-6">
      <Glass variant="strong" className="p-6 sm:p-10">
        <h1 className="font-display text-4xl sm:text-5xl">Seu céu, calculado de verdade</h1>
        <p className="mt-4 max-w-2xl text-lg text-text-main/90">
          Mapa astral com precisão astronômica e, em breve, tiragens de tarot interpretadas por IA.
        </p>
        <Link
          href="/mapa"
          className="mt-6 inline-block rounded-lg bg-neon-nebula px-6 py-3 font-semibold text-bg-deep transition hover:shadow-[0_0_18px_var(--color-neon-nebula)]"
        >
          Calcular meu mapa astral
        </Link>
      </Glass>
    </section>
  );
}
