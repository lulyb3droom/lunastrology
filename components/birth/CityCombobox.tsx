"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface PlaceOption {
  displayName: string;
  lat: number;
  lon: number;
  tz: string;
}

interface Props {
  value: PlaceOption | null;
  onChange: (place: PlaceOption | null) => void;
  error?: string;
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 650; // o serviço gratuito de mapas pede calma: no máximo ~1 busca por segundo

/** Campo de cidade com autocomplete acessível (padrão ARIA "combobox" com lista). */
export function CityCombobox({ value, onChange, error }: Props) {
  const id = useId();
  const listId = `${id}-lista`;
  const [text, setText] = useState(value?.displayName ?? "");
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  const query = text.trim();
  const shouldSearch = !value && query.length >= MIN_CHARS;

  useEffect(() => {
    if (!shouldSearch) return;
    const q = query;
    const timer = setTimeout(async () => {
      setStatus("loading");
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { places?: PlaceOption[] };
        if (!res.ok) throw new Error("falha");
        setOptions(data.places ?? []);
        setStatus((data.places ?? []).length === 0 ? "empty" : "idle");
        setOpen(true);
        setActive(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, shouldSearch]);

  // Sem busca ativa (texto curto ou local já escolhido), ignora o que sobrou de buscas anteriores.
  const visible = shouldSearch ? options : [];
  const shownStatus = shouldSearch ? status : "idle";
  const expanded = open && visible.length > 0;

  function choose(p: PlaceOption) {
    onChange(p);
    setText(p.displayName);
    setOpen(false);
    setOptions([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!expanded) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % visible.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? visible.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(visible[active]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-semibold">
        Cidade de nascimento
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-op-${active}` : undefined}
        aria-invalid={!!error}
        aria-describedby={`${id}-ajuda`}
        autoComplete="off"
        value={text}
        placeholder="Comece a digitar, ex.: Goiânia"
        onChange={(e) => {
          setText(e.target.value);
          if (value) onChange(null); // editou o texto: a escolha anterior deixa de valer
        }}
        onKeyDown={onKeyDown}
        onFocus={() => visible.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="mt-1 w-full rounded-lg border border-white-cosmic/20 bg-bg-deep/70 px-3 py-2 text-text-main placeholder:text-text-main/50"
      />
      <ul
        id={listId}
        role="listbox"
        hidden={!expanded}
        className="glass-strong absolute z-30 mt-1 max-h-64 w-full overflow-auto p-1"
      >
        {visible.map((o, i) => (
          <li
            key={`${o.displayName}-${o.lat}`}
            id={`${id}-op-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              choose(o);
            }}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm ${i === active ? "bg-neon-nebula text-bg-deep" : "hover:bg-violet-astral/40"}`}
          >
            {o.displayName}
          </li>
        ))}
      </ul>
      <p id={`${id}-ajuda`} className="mt-1 text-xs text-text-main/80" aria-live="polite">
        {value
          ? `Local escolhido. Fuso horário: ${value.tz}.`
          : shownStatus === "loading"
            ? "Buscando cidades…"
            : shownStatus === "empty"
              ? "Nenhuma cidade encontrada. Tente o nome sem abreviações."
              : shownStatus === "error"
                ? "A busca de cidades está indisponível agora. Tente de novo em instantes."
                : `Digite ao menos ${MIN_CHARS} letras e escolha na lista.`}
      </p>
      {error && (
        <p role="alert" className="mt-1 text-sm font-semibold text-neon-nebula">
          {error}
        </p>
      )}
    </div>
  );
}
