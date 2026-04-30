import { and, count, eq, gte } from "drizzle-orm";

import { db } from "#/db/index.ts";
import { authAttempts } from "#/db/schema.ts";

const WINDOW_MS = 30 * 60 * 1000;
const MAX_FAILURES = 10;

export async function isBlocked(ip: string): Promise<boolean> {
	const since = new Date(Date.now() - WINDOW_MS);
	const [row] = await db
		.select({ n: count() })
		.from(authAttempts)
		.where(
			and(
				eq(authAttempts.ip, ip),
				eq(authAttempts.success, false),
				gte(authAttempts.attemptedAt, since),
			),
		);
	return (row?.n ?? 0) >= MAX_FAILURES;
}

export async function recordAttempt(
	ip: string,
	userAgent: string | null,
	success: boolean,
): Promise<void> {
	await db.insert(authAttempts).values({
		ip,
		userAgent,
		success,
		attemptedAt: new Date(),
	});
}
