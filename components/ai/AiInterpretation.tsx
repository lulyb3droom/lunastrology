"use client";

import { useRef, useState } from "react";
import { Glass } from "@/components/Glass";
import { RichText } from "./RichText";

interface Props {
  /** rota POST que devolve o texto em streaming */
  endpoint: string;
  /** interpretação já salva (aparece direto, sem gastar IA) */
  initialText: string | null;
  title: string;
  startLabel: string;
  /** desativa o botão (ex.: tarot com cartas ainda não viradas) */
  disabled?: boolean;
  disabledHint?: string;
  note?: string;
}

type Status = "idle" | "streaming" | "done" | "error";

export function AiInterpretation({ endpoint, initialText, title, startLabel, disabled, disabledHint, note }: Props) {
  const [text, setText] = useState(initialText ?? "");
  const [status, setStatus] = useState<Status>(initialText ? "done" : "idle");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function start() {
    setError("");
    setText("");
    setStatus("streaming");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(endpoint, { method: "POST", signal: ctrl.signal });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Não foi possível gerar a interpretação agora. Tente de novo.");
        setStatus("error");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setText((t) => t + chunk);
      }
      setStatus("done");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      // Caiu no meio: o texto que já chegou continua na tela e a pessoa pode tentar de novo.
      setError("A resposta foi interrompida. Você pode tentar de novo.");
      setStatus("error");
    }
  }

  const busy = status === "streaming";

  return (
    <Glass variant="strong" className="p-5 sm:p-8" as="section">
      <h2 className="font-display text-3xl">{title}</h2>

      {status === "idle" || (status === "error" && !text) ? (
        <div className="mt-3 space-y-3">
          <p className="text-text-main/90">
            Uma leitura escrita por inteligência artificial a partir dos dados calculados. Ela é gerada uma vez e fica
            salva.
          </p>
          {note && <p className="text-sm text-text-main/70">{note}</p>}
          <button
            type="button"
            onClick={start}
            disabled={disabled}
            className="rounded-lg bg-neon-nebula px-5 py-3 font-semibold text-bg-deep transition hover:shadow-[0_0_18px_var(--color-neon-nebula)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {startLabel}
          </button>
          {disabled && disabledHint && <p className="text-sm text-text-main/80">{disabledHint}</p>}
        </div>
      ) : (
        <div className="mt-4" aria-busy={busy}>
          {busy && !text && (
            <p role="status" className="text-text-main/80">
              Consultando os astros…
            </p>
          )}
          {text && <RichText text={text} />}
          {busy && text && (
            <p role="status" className="mt-3 text-sm text-text-main/70">
              Escrevendo…
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-neon-nebula/60 bg-bg-deep/60 p-3 text-sm font-semibold">
          {error}
          {status === "error" && text && (
            <button type="button" onClick={start} className="ml-3 text-neon-nebula underline underline-offset-4">
              Tentar de novo
            </button>
          )}
          {status === "error" && !text && (
            <span className="ml-1 font-normal text-text-main/80">Use o botão acima para tentar de novo.</span>
          )}
        </div>
      )}

      <p className="mt-5 text-xs text-text-main/70">
        Texto gerado por inteligência artificial, para reflexão e autoconhecimento. Não é previsão do futuro nem
        orientação médica, jurídica ou financeira.
      </p>
    </Glass>
  );
}
