"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DailyCardButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function draw() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread: "carta-do-dia" }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (res.ok && data.id) {
        router.push(`/tarot/${data.id}`);
        return;
      }
      setError(data.error ?? "Algo deu errado. Tente de novo.");
    } catch {
      setError("Sem conexão com o servidor. Tente de novo.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={draw}
        disabled={loading}
        className="rounded-lg bg-violet-astral px-5 py-3 font-semibold text-white-cosmic transition hover:shadow-[0_0_18px_var(--color-neon-nebula)] disabled:opacity-60"
      >
        {loading ? "Embaralhando…" : "Tirar minha carta do dia"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-neon-nebula">
          {error}
        </p>
      )}
    </div>
  );
}
