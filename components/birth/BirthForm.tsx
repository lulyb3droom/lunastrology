"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { HOUSE_SYSTEMS, HOUSE_SYSTEM_LABELS } from "@/lib/charts/house-systems";
import { CityCombobox, type PlaceOption } from "./CityCombobox";

const field =
  "mt-1 w-full rounded-lg border border-white-cosmic/20 bg-bg-deep/70 px-3 py-2 text-text-main disabled:opacity-50";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BirthForm() {
  const router = useRouter();
  const uid = useId();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [place, setPlace] = useState<PlaceOption | null>(null);
  const [houseSystem, setHouseSystem] = useState("placidus");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setLoading(true);
    try {
      const res = await fetch("/api/mapa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date,
          time,
          timeUnknown,
          houseSystem,
          placeName: place?.displayName ?? "",
          lat: place?.lat ?? null,
          lon: place?.lon ?? null,
        }),
      });
      const data = (await res.json()) as { id?: string; errors?: Record<string, string>; error?: string };
      if (res.ok && data.id) {
        router.push(`/mapa/${data.id}`);
        return; // mantém o botão em "calculando" até a nova página abrir
      }
      if (data.errors) setErrors(data.errors);
      else setFormError(data.error ?? "Algo deu errado. Tente de novo.");
    } catch {
      setFormError("Sem conexão com o servidor. Verifique sua internet e tente de novo.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor={`${uid}-nome`} className="block text-sm font-semibold">
          Nome <span className="font-normal text-text-main/70">(opcional)</span>
        </label>
        <input
          id={`${uid}-nome`}
          className={field}
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-data`} className="block text-sm font-semibold">
            Data de nascimento
          </label>
          <input
            id={`${uid}-data`}
            type="date"
            min="1800-01-01"
            max={todayLocal()}
            className={field}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? `${uid}-data-erro` : undefined}
          />
          {errors.date && (
            <p id={`${uid}-data-erro`} role="alert" className="mt-1 text-sm font-semibold text-neon-nebula">
              {errors.date}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-hora`} className="block text-sm font-semibold">
            Hora de nascimento
          </label>
          <input
            id={`${uid}-hora`}
            type="time"
            className={field}
            value={timeUnknown ? "" : time}
            disabled={timeUnknown}
            onChange={(e) => setTime(e.target.value)}
            aria-invalid={!!errors.time}
            aria-describedby={errors.time ? `${uid}-hora-erro` : undefined}
          />
          {errors.time && (
            <p id={`${uid}-hora-erro`} role="alert" className="mt-1 text-sm font-semibold text-neon-nebula">
              {errors.time}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-neon-nebula"
            checked={timeUnknown}
            onChange={(e) => setTimeUnknown(e.target.checked)}
          />
          Não sei minha hora de nascimento
        </label>
        {timeUnknown && (
          <p className="mt-2 rounded-lg border border-white-cosmic/15 bg-bg-deep/50 p-3 text-sm">
            Vamos calcular para o meio-dia. Sem a hora, <b>não mostramos Ascendente, Meio do Céu nem casas</b>, e a
            posição da Lua pode variar até cerca de 6°.
          </p>
        )}
      </div>

      <CityCombobox value={place} onChange={setPlace} error={errors.place} />

      <details className="rounded-lg border border-white-cosmic/15 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Opções avançadas</summary>
        <div className="mt-3">
          <label htmlFor={`${uid}-casas`} className="block text-sm font-semibold">
            Sistema de casas
          </label>
          <select
            id={`${uid}-casas`}
            className={field}
            value={houseSystem}
            onChange={(e) => setHouseSystem(e.target.value)}
          >
            {HOUSE_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {HOUSE_SYSTEM_LABELS[s]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-text-main/80">
            Placidus é o mais usado. Você pode trocar depois, na página do mapa.
          </p>
        </div>
      </details>

      {formError && (
        <p role="alert" className="rounded-lg border border-neon-nebula/60 bg-bg-deep/60 p-3 text-sm font-semibold">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-neon-nebula px-5 py-3 font-semibold text-bg-deep transition hover:shadow-[0_0_18px_var(--color-neon-nebula)] disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Calculando…" : "Calcular meu mapa"}
      </button>

      <p className="text-xs text-text-main/70">
        Seus dados de nascimento são pessoais: usamos só para calcular o mapa e guardamos neste navegador por até 30 dias.
        Veja a <a href="/privacidade" className="text-neon-nebula underline underline-offset-2">política de privacidade</a>.
      </p>
    </form>
  );
}
