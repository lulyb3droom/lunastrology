"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { SPREADS } from "@/lib/tarot/spreads";
import { CrisisNotice } from "./CrisisNotice";

const QUESTION_MAX = 300;

export function SpreadPicker() {
  const router = useRouter();
  const name = useId();
  const [spread, setSpread] = useState<string>("passado-presente-futuro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [crisis, setCrisis] = useState<string | null>(null);
  const questionId = useId();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCrisis(null);
    setLoading(true);
    try {
      const res = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread, question }),
      });
      const data = (await res.json()) as { id?: string; error?: string; crisis?: boolean; message?: string };
      if (data.crisis && data.message) {
        setCrisis(data.message); // sem tiragem: acolhimento e CVV
        setLoading(false);
        return;
      }
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

      {spread !== "carta-do-dia" && (
        <div>
          <label htmlFor={questionId} className="block text-sm font-semibold">
            Sua pergunta <span className="font-normal text-text-main/70">(opcional)</span>
          </label>
          <textarea
            id={questionId}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={QUESTION_MAX}
            rows={3}
            placeholder="Ex.: o que preciso olhar com mais atenção neste momento?"
            aria-describedby={`${questionId}-ajuda`}
            className="mt-1 w-full rounded-lg border border-white-cosmic/20 bg-bg-deep/70 px-3 py-2 text-text-main placeholder:text-text-main/50"
          />
          <p id={`${questionId}-ajuda`} className="mt-1 flex justify-between text-xs text-text-main/80">
            <span>Perguntas abertas funcionam melhor. O tarot não substitui orientação médica, jurídica ou financeira.</span>
            <span aria-live="off">{question.length}/{QUESTION_MAX}</span>
          </p>
        </div>
      )}

      {crisis && <CrisisNotice message={crisis} />}

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
