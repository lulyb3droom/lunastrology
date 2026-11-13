"use client";

import Link from "next/link";
import { useState } from "react";
import { Glass } from "@/components/Glass";
import { TarotCardButton } from "./TarotCardButton";

export interface BoardCard {
  position: number;
  cardId: string;
  name: string;
  reversed: boolean;
  positionName: string;
  positionHint: string;
  keywords: string[];
  upright: string;
  reversedMeaning: string;
}

interface Props {
  spreadId: string;
  spreadName: string;
  cards: BoardCard[];
}

// Cruz Celta: [coluna, linha] de cada posição (0 = 1ª carta). A carta 2 (índice 1) cruza a 1.
const CELTIC: [number, number][] = [
  [2, 2], [2, 2], [2, 3], [1, 2], [2, 1], [3, 2],
  [5, 4], [5, 3], [5, 2], [5, 1],
];

export function ReadingBoard({ spreadId, spreadName, cards }: Props) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setFlipped((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const allFlipped = flipped.size === cards.length;
  const celtic = spreadId === "cruz-celta";

  const size =
    spreadId === "carta-do-dia"
      ? "w-[clamp(140px,46vw,240px)]"
      : celtic
        ? "w-[var(--cw)]"
        : "w-[clamp(84px,27vw,180px)]";

  const card = (c: BoardCard, extra = "", rotate = 0) => (
    <div className={`tarot-deal ${extra}`} style={{ "--i": c.position } as React.CSSProperties} key={c.position}>
      <TarotCardButton
        cardId={c.cardId}
        name={c.name}
        reversed={c.reversed}
        flipped={flipped.has(c.position)}
        positionLabel={`${c.positionName}`}
        onFlip={() => toggle(c.position)}
        rotate={rotate}
        className={size}
      />
      {!(celtic && c.position === 1) && (
        <p className="mt-2 text-center text-xs text-text-main/90">{celtic ? c.position + 1 : c.positionName}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Mesa: fora de qualquer vidro, para as cartas não usarem blur ao virar */}
      <div className="relative rounded-2xl px-2 py-8">
        <div className="tarot-shuffle" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((k) => (
            <span key={k} style={{ "--k": k } as React.CSSProperties}>
              <span className="tarot-back block aspect-[420/727] w-[clamp(70px,20vw,110px)]" />
            </span>
          ))}
        </div>
        <p className="sr-only" role="status">
          Cartas sorteadas. Toque em cada carta para virá-la.
        </p>

        {celtic ? (
          <div
            className="mx-auto grid w-fit [--cw:clamp(52px,15vw,104px)]"
            style={{
              gridTemplateColumns: "repeat(3, var(--cw)) calc(var(--cw) * 0.4) var(--cw)",
              columnGap: "calc(var(--cw) * 0.4)",
              rowGap: "0.9rem",
            }}
          >
            {cards.map((c) => {
              const [col, row] = CELTIC[c.position]!;
              const isCross = c.position === 1;
              // A carta 2 ocupa a MESMA célula da carta 1 e fica por cima, girada 90°.
              return (
                <div
                  key={c.position}
                  style={{ gridColumn: col, gridRow: row }}
                  className={`self-start ${isCross ? "z-10" : ""}`}
                >
                  {card(c, "", isCross ? 90 : 0)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto flex flex-wrap justify-center gap-4 sm:gap-8">{cards.map((c) => card(c))}</div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFlipped(allFlipped ? new Set() : new Set(cards.map((c) => c.position)))}
          className="rounded-lg bg-violet-astral px-4 py-2 text-white-cosmic transition hover:shadow-[0_0_18px_var(--color-neon-nebula)]"
        >
          {allFlipped ? "Virar todas para baixo" : "Virar todas"}
        </button>
        <Link href="/tarot" className="text-neon-nebula underline underline-offset-4">
          Fazer outra tiragem
        </Link>
      </div>

      {/* Significados das cartas já viradas */}
      <section aria-live="polite" className="space-y-4">
        <h2 className="font-display text-3xl">{spreadName}</h2>
        {flipped.size === 0 && <p className="text-text-main/80">Vire as cartas para ler o que cada uma traz.</p>}
        <ol className="space-y-4">
          {cards
            .filter((c) => flipped.has(c.position))
            .map((c) => (
              <li key={c.position}>
                <Glass className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neon-nebula">
                    {c.positionName}
                    <span className="ml-2 font-normal normal-case text-text-main/70">· {c.positionHint}</span>
                  </p>
                  <h3 className="mt-1 font-display text-2xl">
                    {c.name}
                    {c.reversed && <span className="ml-2 text-base text-text-main/80">(invertida)</span>}
                  </h3>
                  <p className="mt-1 text-sm text-text-main/80">{c.keywords.join(" · ")}</p>
                  <p className="mt-3">{c.reversed ? c.reversedMeaning : c.upright}</p>
                </Glass>
              </li>
            ))}
        </ol>
      </section>
    </div>
  );
}
