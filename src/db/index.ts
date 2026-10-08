import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Reuse one client across hot reloads in dev.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
// prepare: false keeps it compatible with Supabase's transaction pooler.
const client = globalForDb.pg ?? postgres(url, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
