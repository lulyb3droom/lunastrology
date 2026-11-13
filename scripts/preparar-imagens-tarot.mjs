// Redimensiona as digitalizações do Rider-Waite-Smith de 1909 (Wikimedia Commons, domínio público)
// para WebP leve e dá nomes padronizados (m00..m21, w01..w14, c01.., s01.., p01..).
// Uso: node scripts/preparar-imagens-tarot.mjs <pasta-com-os-jpeg-originais>
import { readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2];
if (!src) throw new Error("Informe a pasta com os arquivos RWS1909_-_*.jpeg");
const out = "public/tarot";
mkdirSync(out, { recursive: true });

const SUIT = { Wands: "w", Cups: "c", Swords: "s", Pentacles: "p" };
let n = 0;
for (const file of readdirSync(src)) {
  let id;
  let m = file.match(/^RWS1909_-_(\d{2})_/);
  if (m) id = `m${m[1]}`;
  else if ((m = file.match(/^RWS1909_-_(Wands|Cups|Swords|Pentacles)_(\d{2})\.jpeg$/))) id = `${SUIT[m[1]]}${m[2]}`;
  if (!id) continue;
  await sharp(path.join(src, file))
    .resize({ width: 420 })
    .webp({ quality: 78 })
    .toFile(path.join(out, `${id}.webp`));
  n++;
}
console.log(n, "imagens geradas em", out);
