import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Verificação simples: o site está no ar e consegue falar com o banco?
export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, banco: "ok" });
  } catch {
    return Response.json({ ok: false, banco: "erro" }, { status: 503 });
  }
}
