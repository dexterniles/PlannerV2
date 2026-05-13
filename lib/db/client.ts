import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleClient | null = null;

function buildClient(): DrizzleClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in .env.local (see .env.example).",
    );
  }
  const client = postgres(url, { prepare: false, max: 10 });
  return drizzle(client, { schema });
}

export const db = new Proxy({} as DrizzleClient, {
  get(_target, prop) {
    if (!cached) cached = buildClient();
    return Reflect.get(cached as object, prop);
  },
}) as DrizzleClient;

export type Database = DrizzleClient;
