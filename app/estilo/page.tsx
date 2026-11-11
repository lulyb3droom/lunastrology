import type { Metadata } from "next";
import { Glass } from "@/components/Glass";

export const metadata: Metadata = { title: "Guia de estilo", robots: { index: false } };

const TOKENS = [
  ["bg-deep", "bg-bg-deep"],
  ["bg-cosmic", "bg-bg-cosmic"],
  ["violet-astral", "bg-violet-astral"],
  ["white-cosmic", "bg-white-cosmic"],
  ["text-main", "bg-text-main"],
  ["neon-nebula", "bg-neon-nebula"],
] as const;

export default function Estilo() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Guia de estilo</h1>
      <Glass className="p-6">
        <h2 className="font-display text-2xl">Cores (tokens)</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TOKENS.map(([nome, cls]) => (
            <li key={nome} className="flex items-center gap-3">
              <span
                className={`h-8 w-8 rounded-full border border-white-cosmic/30 ${cls}`}
                aria-hidden="true"
              />
              <span className="text-sm">{nome}</span>
            </li>
          ))}
        </ul>
      </Glass>
      <div className="grid gap-4 sm:grid-cols-3">
        <Glass variant="subtle" className="p-5">
          <b>glass-subtle</b>
          <p className="mt-1 text-sm">Informações secundárias.</p>
        </Glass>
        <Glass className="p-5">
          <b>glass</b>
          <p className="mt-1 text-sm">Padrão para cards.</p>
        </Glass>
        <Glass variant="strong" className="p-5">
          <b>glass-strong</b>
          <p className="mt-1 text-sm">Header, modais e interpretação.</p>
        </Glass>
      </div>
      <Glass className="space-y-4 p-6">
        <h2 className="font-display text-2xl">Botões e links</h2>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-violet-astral px-4 py-2 text-white-cosmic transition hover:shadow-[0_0_18px_var(--color-neon-nebula)]">
            Ação secundária
          </button>
          <button className="rounded-lg bg-neon-nebula px-4 py-2 font-semibold text-bg-deep transition hover:shadow-[0_0_18px_var(--color-neon-nebula)]">
            Ação principal
          </button>
          <a href="#" className="self-center text-neon-nebula underline underline-offset-4">
            Um link
          </a>
        </div>
        <p className="text-sm text-text-main/80">
          Contraste: texto em text-main sobre bg-deep/bg-cosmic; links em neon-nebula (~5:1);
          violet-astral nunca como cor de texto.
        </p>
      </Glass>
    </div>
  );
}
