import { parseInline, parseRichText } from "@/lib/ai/rich-text";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((p, i) =>
        p.bold ? (
          <strong key={i} className="font-semibold">
            {p.text}
          </strong>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/** Mostra o texto da IA com títulos, parágrafos e negrito (sem HTML cru). */
export function RichText({ text }: { text: string }) {
  const blocks = parseRichText(text);
  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((b, i) =>
        b.type === "heading" ? (
          <h3 key={i} className="pt-2 font-display text-2xl text-text-main first:pt-0">
            {b.text}
          </h3>
        ) : b.type === "list" ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((it, j) => (
              <li key={j}>
                <Inline text={it} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        ),
      )}
    </div>
  );
}
