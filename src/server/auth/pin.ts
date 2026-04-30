import { desc } from "drizzle-orm";

import { db } from "#/db/index.ts";
import { authPin, authPinChanges } from "#/db/schema.ts";

import { hashPin, verifyPin } from "./argon.ts";

export const PIN_REGEX = /^\d{6}$/;

export function isValidPinFormat(pin: string): boolean {
	return PIN_REGEX.test(pin);
}

async function getCurrentPinHash(): Promise<string | null> {
	const [row] = await db
		.select({ hash: authPin.hash })
		.from(authPin)
		.orderBy(desc(authPin.updatedAt))
		.limit(1);
	return row?.hash ?? null;
}

export async function verifyCurrentPin(pin: string): Promise<boolean> {
	const hash = await getCurrentPinHash();
	if (!hash) return false;
	return verifyPin(pin, hash);
}

export function verifyMasterPin(pin: string): boolean {
	const master = process.env.MASTER_PIN;
	if (!master) return false;
	if (master.length !== pin.length) return false;
	let mismatch = 0;
	for (let i = 0; i < master.length; i++) {
		mismatch |= master.charCodeAt(i) ^ pin.charCodeAt(i);
	}
	return mismatch === 0;
}

export async function setNewPin(
	newPin: string,
	ctx: { ip: string | null; userAgent: string | null },
): Promise<void> {
	const hash = await hashPin(newPin);
	const now = new Date();

	await db.transaction(async (tx) => {
		await tx
			.insert(authPin)
			.values({ id: 1, hash, updatedAt: now })
			.onConflictDoUpdate({
				target: authPin.id,
				set: { hash, updatedAt: now },
			});
		await tx.insert(authPinChanges).values({
			changedAt: now,
			ip: ctx.ip,
			userAgent: ctx.userAgent,
		});
	});
}

export async function hasPinConfigured(): Promise<boolean> {
	const hash = await getCurrentPinHash();
	return hash !== null;
}
