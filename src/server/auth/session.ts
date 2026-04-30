import { and, eq, gt } from "drizzle-orm";

import { db } from "#/db/index.ts";
import { sessions } from "#/db/schema.ts";

import {
	parseCookies,
	SESSION_COOKIE_NAME,
	serializeCookie,
} from "./cookie.ts";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function generateSessionId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type Session = {
	id: string;
	expiresAt: Date;
	createdAt: Date;
	lastSeenAt: Date;
	ip: string | null;
	userAgent: string | null;
};

export async function createSession(
	ip: string | null,
	userAgent: string | null,
): Promise<Session> {
	const id = generateSessionId();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

	const [row] = await db
		.insert(sessions)
		.values({
			id,
			expiresAt,
			createdAt: now,
			lastSeenAt: now,
			ip,
			userAgent,
		})
		.returning();

	return row as Session;
}

export async function getSessionFromRequest(
	req: Request,
): Promise<Session | null> {
	const cookies = parseCookies(req.headers.get("cookie"));
	return getValidSession(cookies[SESSION_COOKIE_NAME]);
}

export async function getValidSession(
	id: string | undefined,
): Promise<Session | null> {
	if (!id) return null;
	const now = new Date();
	const [row] = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
		.limit(1);

	if (!row) return null;

	await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, id));

	return row as Session;
}

export async function destroySession(id: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, id));
}

const IS_PROD = process.env.NODE_ENV === "production";

export function buildSessionSetCookie(session: Session): string {
	return serializeCookie(SESSION_COOKIE_NAME, session.id, {
		maxAge: Math.floor(SESSION_DURATION_MS / 1000),
		expires: session.expiresAt,
		secure: IS_PROD,
	});
}

export function buildSessionClearCookie(): string {
	return serializeCookie(SESSION_COOKIE_NAME, "", {
		maxAge: 0,
		expires: new Date(0),
		secure: IS_PROD,
	});
}
