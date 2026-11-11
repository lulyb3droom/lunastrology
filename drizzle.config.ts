import { defineConfig } from "drizzle-kit";

// Migrações usam a conexão "sem pool" (recomendada pela Neon para migrar).
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
