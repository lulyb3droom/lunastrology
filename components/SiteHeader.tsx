import Link from "next/link";
import { Glass } from "./Glass";

const LINKS = [
  { href: "/mapa", label: "Mapa astral" },
  { href: "/tarot", label: "Tarot" },
  { href: "/aprender", label: "Aprender" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 px-4 pt-3">
      <Glass
        as="nav"
        variant="strong"
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link href="/" className="font-display text-2xl tracking-wide text-text-main">
          ☾ Lunastrology
        </Link>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-neon-nebula underline-offset-4 hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </Glass>
    </header>
  );
}
