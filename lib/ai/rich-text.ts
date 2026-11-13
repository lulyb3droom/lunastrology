/**
 * Markdown simples (só o que pedimos à IA): "## título", parágrafos, "- item" e **negrito**.
 * Devolve blocos de dados; quem desenha usa elementos React (nunca HTML cru), então não há risco de injeção.
 */
export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "paragraph", text: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (list?.length) blocks.push({ type: "list", items: list });
    list = null;
  };

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const heading = line.match(/^#{1,4}\s+(.+)$/);
    const item = line.match(/^[-*•]\s+(.+)$/);
    if (!line) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ type: "heading", text: heading[1]!.replace(/\*\*/g, "") });
    } else if (item) {
      flushPara();
      (list ??= []).push(item[1]!);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

/** Quebra uma linha em pedaços normais e em negrito. */
export function parseInline(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}
