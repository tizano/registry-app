import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.ts";

const connectionString =
	process.env.DATABASE_URL_POOLER ?? process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString, max: 1 });

export const db = drizzle(pool, { schema });
