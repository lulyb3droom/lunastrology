import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Conexão criada só quando usada, para o build não falhar sem DATABASE_URL.
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não está definida.");
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

export { schema };
