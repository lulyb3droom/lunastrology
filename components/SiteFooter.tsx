import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-5xl px-4 pb-10 text-center text-sm text-text-main/80">
      <p>
        Astrologia e tarot são oferecidos para entretenimento e autoconhecimento. Não substituem
        orientação médica, jurídica ou financeira.
      </p>
      <p className="mt-3 flex justify-center gap-5">
        <Link href="/privacidade" className="text-neon-nebula underline-offset-4 hover:underline">
          Privacidade
        </Link>
        <Link href="/termos" className="text-neon-nebula underline-offset-4 hover:underline">
          Termos de uso
        </Link>
      </p>
    </footer>
  );
}
