import { CVV_PHONE, CVV_SITE } from "@/lib/ai/safety";
import { Glass } from "@/components/Glass";

/** Acolhimento mostrado no lugar da tiragem quando a pergunta sugere risco à vida. */
export function CrisisNotice({ message }: { message: string }) {
  return (
    <Glass variant="strong" className="space-y-4 p-5 sm:p-6" as="section">
      <div role="alert" className="space-y-3">
        <h2 className="font-display text-2xl">Antes de tudo, você importa</h2>
        <p>{message}</p>
      </div>
      <p className="flex flex-wrap gap-3">
        <a
          href={`tel:${CVV_PHONE}`}
          className="rounded-lg bg-neon-nebula px-5 py-3 font-semibold text-bg-deep transition hover:shadow-[0_0_18px_var(--color-neon-nebula)]"
        >
          Ligar para o CVV: {CVV_PHONE}
        </a>
        <a
          href={CVV_SITE}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white-cosmic/30 px-5 py-3 font-semibold transition hover:border-neon-nebula"
        >
          Conversar pelo chat (cvv.org.br)
        </a>
      </p>
    </Glass>
  );
}
