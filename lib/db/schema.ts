import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Esquema inicial. As tabelas do login (accounts, sessions) entram na Fase 5.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const birthCharts = pgTable(
  "birth_charts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    label: text("label"),
    birthLocalDate: text("birth_local_date").notNull(), // AAAA-MM-DD
    birthLocalTime: text("birth_local_time"), // HH:MM (nulo se hora desconhecida)
    timeUnknown: boolean("time_unknown").notNull().default(false),
    placeName: text("place_name").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    tz: text("tz").notNull(),
    utcInstant: timestamp("utc_instant", { withTimezone: true }).notNull(),
    houseSystem: text("house_system").notNull().default("placidus"),
    result: jsonb("result").notNull(),
    calcVersion: text("calc_version").notNull(),
    interpretation: text("interpretation"),
    interpretationModel: text("interpretation_model"),
    shareToken: text("share_token").unique(), // nulo = não compartilhável (padrão)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("birth_charts_user_idx").on(t.userId)],
);

export const tarotReadings = pgTable(
  "tarot_readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    spread: text("spread").notNull(),
    question: text("question"),
    cards: jsonb("cards").notNull(), // [{ carta, posicao, invertida }]
    interpretation: text("interpretation"),
    model: text("model"),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tarot_readings_user_idx").on(t.userId)],
);

export const geocodeCache = pgTable("geocode_cache", {
  queryNorm: text("query_norm").primaryKey(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  tz: text("tz").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // "tarot" | "mapa"
  model: text("model").notNull(),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  costUsd: numeric("cost_usd", { precision: 12, scale: 6 }),
  status: text("status").notNull(), // "ok" | "erro" | "reserva"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(), // hash do IP ou id do usuário
    day: text("day").notNull(), // AAAA-MM-DD
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.day] })],
);

export const errorLog = pgTable("error_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  where: text("where").notNull(),
  message: text("message").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
