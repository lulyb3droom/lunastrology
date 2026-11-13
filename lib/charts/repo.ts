import { and, eq } from "drizzle-orm";
import { calculateChart, type ChartResult, type HouseSystem } from "@/lib/astro";
import { getDb, schema } from "@/lib/db";
import type { BirthFormData } from "./input";
import { getVisitorId, hashVisitor } from "./visitor";

export interface StoredChart {
  id: string;
  label: string | null;
  placeName: string;
  birthLocalDate: string;
  birthLocalTime: string | null;
  timeUnknown: boolean;
  lat: number;
  lon: number;
  tz: string;
  houseSystem: HouseSystem;
  result: ChartResult;
  calcVersion: string;
  interpretation: string | null;
  createdAt: Date;
}

/** Calcula e grava o mapa. Devolve o id (UUID). */
export async function createChart(data: BirthFormData, visitorId: string): Promise<string> {
  const result = calculateChart(data.chart);
  const [row] = await getDb()
    .insert(schema.birthCharts)
    .values({
      label: data.name,
      birthLocalDate: data.chart.date,
      birthLocalTime: data.chart.timeUnknown ? null : (data.chart.time ?? null),
      timeUnknown: !!data.chart.timeUnknown,
      placeName: data.placeName,
      lat: data.chart.lat,
      lon: data.chart.lon,
      tz: data.chart.tz,
      utcInstant: new Date(result.instant.utcIso),
      houseSystem: data.chart.houseSystem ?? "placidus",
      result,
      calcVersion: result.calcVersion,
      visitorHash: hashVisitor(visitorId),
    })
    .returning({ id: schema.birthCharts.id });
  return row!.id;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Busca um mapa, mas SÓ se pertencer a este visitante (cookie).
 * O link do mapa não funciona em outro navegador: o compartilhamento é opt-in (Fase 5).
 */
export async function getChartForVisitor(id: string): Promise<StoredChart | null> {
  if (!UUID.test(id)) return null;
  const visitor = await getVisitorId();
  if (!visitor) return null;
  const rows = await getDb()
    .select()
    .from(schema.birthCharts)
    .where(and(eq(schema.birthCharts.id, id), eq(schema.birthCharts.visitorHash, hashVisitor(visitor))))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    label: r.label,
    placeName: r.placeName,
    birthLocalDate: r.birthLocalDate,
    birthLocalTime: r.birthLocalTime,
    timeUnknown: r.timeUnknown,
    lat: r.lat,
    lon: r.lon,
    tz: r.tz,
    houseSystem: r.houseSystem as HouseSystem,
    result: r.result as ChartResult,
    calcVersion: r.calcVersion,
    interpretation: r.interpretation,
    createdAt: r.createdAt,
  };
}

/** Guarda a interpretação do mapa (gerada uma vez; depois é reaproveitada). */
export async function saveChartInterpretation(id: string, text: string, model: string): Promise<void> {
  await getDb()
    .update(schema.birthCharts)
    .set({ interpretation: text, interpretationModel: model })
    .where(eq(schema.birthCharts.id, id));
}
