import { interpretResponse } from "@/lib/ai/interpret";
import { buildTarotMessages } from "@/lib/ai/messages";
import { getReadingForVisitor, saveReadingInterpretation } from "@/lib/tarot/repo";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // o streaming pode levar até ~1 minuto (limite do plano gratuito)

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reading = await getReadingForVisitor(id);
  if (!reading) return Response.json({ error: "Tiragem não encontrada neste navegador." }, { status: 404 });

  return interpretResponse({
    request,
    kind: "tarot",
    stored: reading.interpretation,
    buildMessages: () => buildTarotMessages(reading.spread, reading.cards, reading.question),
    maxTokens: reading.spread === "cruz-celta" ? 2600 : 1800,
    save: (r) => saveReadingInterpretation(reading.id, r),
  });
}
