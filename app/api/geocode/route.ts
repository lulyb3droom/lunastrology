import { GeocodeError, searchPlaces } from "@/lib/geo/places";
import { BUSY_MESSAGE, LIMITS, clientKey, hit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

class RateLimited extends Error {}

// Busca de cidades para o autocomplete. Só o servidor fala com o Nominatim.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 3 || q.length > 80) return Response.json({ places: [] });
  try {
    const places = await searchPlaces(q, async () => {
      const v = await hit("geocode", clientKey(request), LIMITS.geocode());
      if (!v.allowed) throw new RateLimited();
    });
    return Response.json({ places });
  } catch (e) {
    if (e instanceof RateLimited) return Response.json({ places: [], error: BUSY_MESSAGE }, { status: 429 });
    console.error("geocode", e instanceof GeocodeError ? e.message : e);
    return Response.json(
      { places: [], error: "A busca de cidades está indisponível agora. Tente de novo em instantes." },
      { status: 502 },
    );
  }
}
