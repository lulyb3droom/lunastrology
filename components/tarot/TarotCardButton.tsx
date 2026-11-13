"use client";

import Image from "next/image";

interface Props {
  cardId: string;
  name: string;
  reversed: boolean;
  flipped: boolean;
  /** rótulo para leitores de tela, ex.: "Passado" */
  positionLabel: string;
  onFlip: () => void;
  /** rotação extra da carta (ex.: 90 na carta que cruza, na Cruz Celta) */
  rotate?: number;
  className?: string;
}

/** Uma carta que vira ao toque. Acessível: é um botão, com estado e descrição. */
export function TarotCardButton({ cardId, name, reversed, flipped, positionLabel, onFlip, rotate = 0, className = "" }: Props) {
  const label = flipped
    ? `${positionLabel}: ${name}${reversed ? ", invertida" : ""}.`
    : `${positionLabel}: carta virada para baixo. Toque para virar.`;
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-pressed={flipped}
      aria-label={label}
      data-flipped={flipped}
      className={`tarot-flip block aspect-[420/727] cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-neon-nebula ${className}`}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <span className="tarot-flip-inner block">
        <span className="tarot-face tarot-back block" aria-hidden="true" />
        <span className="tarot-face tarot-face-front block bg-bg-deep">
          <Image
            src={`/tarot/${cardId}.webp`}
            alt=""
            width={420}
            height={727}
            unoptimized
            draggable={false}
            className="h-full w-full object-cover"
            style={reversed ? { transform: "rotate(180deg)" } : undefined}
          />
        </span>
      </span>
    </button>
  );
}
