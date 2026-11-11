import { GeocodeError, searchPlaces } from "@/lib/geo/places";

export const dynamic = "force-dynamic";

// Busca de cidades para o autocomplete. Só o servidor fala com o Nominatim.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 3 || q.length > 80) return Response.json({ places: [] });
  try {
    const places = await searchPlaces(q);
    return Response.json({ places });
  } catch (e) {
    console.error("geocode", e instanceof GeocodeError ? e.message : e);
    return Response.json(
      { places: [], error: "A busca de cidades está indisponível agora. Tente de novo em instantes." },
      { status: 502 },
    );
  }
}
