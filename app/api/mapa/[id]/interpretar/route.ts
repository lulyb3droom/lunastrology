import { interpretResponse } from "@/lib/ai/interpret";
import { buildChartMessages } from "@/lib/ai/messages";
import { getChartForVisitor, saveChartInterpretation } from "@/lib/charts/repo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chart = await getChartForVisitor(id);
  if (!chart) return Response.json({ error: "Mapa não encontrado neste navegador." }, { status: 404 });

  return interpretResponse({
    request,
    kind: "mapa",
    stored: chart.interpretation,
    buildMessages: () => buildChartMessages(chart.result),
    maxTokens: 3000,
    save: (r) => saveChartInterpretation(chart.id, r.text, r.model),
  });
}
