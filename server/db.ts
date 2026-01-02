import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// User requested no database, so we handle missing DATABASE_URL gracefully for this specific project
// In a real production app with DB, this would throw.
const connectionString = process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/db";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
