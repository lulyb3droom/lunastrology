import { defineConfig } from "vitest/config";
import path from "node:path";

// Testes MANUAIS (gastam a cota da IA). Não rodam no `npm test`; use `npm run comparar-modelos`.
export default defineConfig({
  test: { include: ["tests/manual/**/*.manual.ts"], environment: "node", testTimeout: 1_500_000 },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
