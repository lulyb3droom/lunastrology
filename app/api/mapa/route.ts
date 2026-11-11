import { createChart } from "@/lib/charts/repo";
import { parseBirthInput } from "@/lib/charts/input";
import { getOrCreateVisitorId } from "@/lib/charts/visitor";

export const dynamic = "force-dynamic";

// Cria (calcula e salva) um mapa astral.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const parsed = parseBirthInput(body);
  if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 422 });

  try {
    const visitorId = await getOrCreateVisitorId();
    const id = await createChart(parsed.data, visitorId);
    return Response.json({ id });
  } catch (e) {
    console.error("criar mapa", e);
    return Response.json({ error: "Não foi possível calcular o mapa agora. Tente de novo." }, { status: 500 });
  }
}
