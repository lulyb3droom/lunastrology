import { cookies } from "next/headers";
import { CRISIS_MESSAGE, detectCrisis } from "@/lib/ai/safety";
import { sanitizeQuestion } from "@/lib/ai/messages";
import { getOrCreateVisitorId } from "@/lib/charts/visitor";
import { BUSY_MESSAGE, LIMITS, clientKey, hit } from "@/lib/rate-limit";
import { DAILY_COOKIE, getTodaysReading, todayInBrazil } from "@/lib/tarot/daily";
import { createReading } from "@/lib/tarot/repo";
import { isSpreadId } from "@/lib/tarot/spreads";

export const dynamic = "force-dynamic";

// Faz uma tiragem: o SORTEIO acontece aqui, no servidor, com aleatoriedade criptográfica.
export async function POST(request: Request) {
  let body: { spread?: unknown; question?: unknown };
  try {
    body = (await request.json()) as { spread?: unknown; question?: unknown };
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!isSpreadId(body.spread)) {
    return Response.json({ error: "Escolha uma tiragem válida." }, { status: 422 });
  }

  // A carta do dia não tem pergunta.
  const question = body.spread === "carta-do-dia" ? "" : sanitizeQuestion(body.question);

  // Segurança primeiro: sofrimento grave ou risco à vida => acolhimento + CVV, SEM sortear e SEM guardar a pergunta.
  if (question && detectCrisis(question)) {
    return Response.json({ crisis: true, message: CRISIS_MESSAGE });
  }

  try {
    const visitorId = await getOrCreateVisitorId();

    // Carta do dia: só uma por dia por visitante. Se já tirou hoje, devolve a mesma.
    if (body.spread === "carta-do-dia") {
      const existing = await getTodaysReading();
      if (existing) return Response.json({ id: existing.id, repeated: true });
    }

    const verdict = await hit("draw", clientKey(request), LIMITS.drawTarot());
    if (!verdict.allowed) return Response.json({ error: BUSY_MESSAGE }, { status: 429 });

    const id = await createReading(body.spread, question || null, visitorId);

    if (body.spread === "carta-do-dia") {
      (await cookies()).set(DAILY_COOKIE, `${todayInBrazil()}:${id}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 36,
        path: "/",
      });
    }
    return Response.json({ id });
  } catch (e) {
    console.error("tarot", e);
    return Response.json({ error: "Não foi possível fazer a tiragem agora. Tente de novo." }, { status: 500 });
  }
}
