import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "luna_visitor";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

/** Guardamos só o hash do identificador no banco; o valor em si fica apenas no cookie do navegador. */
export const hashVisitor = (id: string) => createHash("sha256").update(id).digest("hex");

/** Lê o identificador do visitante (se houver). */
export async function getVisitorId(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  return v && /^[A-Za-z0-9_-]{20,64}$/.test(v) ? v : null;
}

/** Lê o identificador ou cria um novo (só em Route Handlers / Server Actions). */
export async function getOrCreateVisitorId(): Promise<string> {
  const existing = await getVisitorId();
  if (existing) return existing;
  const id = randomBytes(24).toString("base64url");
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
  return id;
}
