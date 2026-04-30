import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.ts";

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleClient | null = null;

function buildClient(): DrizzleClient {
	const connectionString =
		process.env.DATABASE_URL_POOLER ?? process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error(
			"DATABASE_URL is not set (or DATABASE_URL_POOLER). Configure it in your environment.",
		);
	}
	const pool = new Pool({ connectionString, max: 1 });
	return drizzle(pool, { schema });
}

export const db = new Proxy({} as DrizzleClient, {
	get(_target, prop, receiver) {
		if (!cached) cached = buildClient();
		return Reflect.get(cached, prop, receiver);
	},
}) as DrizzleClient;
