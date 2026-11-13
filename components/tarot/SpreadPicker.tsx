"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { SPREADS } from "@/lib/tarot/spreads";

export function SpreadPicker() {
  const router = useRouter();
  const name = useId();
  const [spread, setSpread] = useState<string>("passado-presente-futuro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (res.ok && data.id) {
        router.push(`/tarot/${data.id}`);
        return;
      }
      setError(data.error ?? "Algo deu errado. Tente de novo.");
    } catch {
      setError("Sem conexão com o servidor. Verifique sua internet e tente de novo.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={go} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">Escolha a tiragem</legend>
        {SPREADS.map((s) => (
          <label
            key={s.id}
            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${spread === s.id ? "border-neon-nebula bg-violet-astral/25" : "border-white-cosmic/15 hover:border-neon-nebula/60"}`}
          >
            <input
              type="radio"
              name={name}
              value={s.id}
              checked={spread === s.id}
              onChange={() => setSpread(s.id)}
              className="mt-1 h-5 w-5 shrink-0 accent-neon-nebula"
            />
            <span>
              <span className="block font-semibold">
                {s.name} <span className="font-normal text-text-main/70">· {s.positions.length} {s.positions.length === 1 ? "carta" : "cartas"}</span>
              </span>
              <span className="mt-1 block text-sm text-text-main/80">{s.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-neon-nebula/60 bg-bg-deep/60 p-3 text-sm font-semibold">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-neon-nebula px-5 py-3 font-semibold text-bg-deep transition hover:shadow-[0_0_18px_var(--color-neon-nebula)] disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Embaralhando…" : "Embaralhar e tirar as cartas"}
      </button>
    </form>
  );
}
