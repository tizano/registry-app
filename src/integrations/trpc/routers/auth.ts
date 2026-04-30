import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	isValidPinFormat,
	setNewPin,
	verifyCurrentPin,
	verifyMasterPin,
} from "#/server/auth/pin.ts";
import { isBlocked, recordAttempt } from "#/server/auth/rate-limit.ts";
import {
	buildSessionClearCookie,
	buildSessionSetCookie,
	createSession,
	destroySession,
} from "#/server/auth/session.ts";
import { protectedProcedure, publicProcedure } from "../init";

const pinInput = z.object({
	pin: z.string().regex(/^\d{6}$/, "Le PIN doit contenir 6 chiffres"),
});

const resetInput = z.object({
	masterPin: z.string().regex(/^\d{6}$/),
	newPin: z.string().regex(/^\d{6}$/),
});

export const authRouter = {
	me: publicProcedure.query(({ ctx }) => {
		console.log("[AUTH][me]", {
			authenticated: ctx.session != null,
			sessionId: ctx.session?.id?.slice(0, 8),
		});
		if (!ctx.session) return { authenticated: false as const };
		return {
			authenticated: true as const,
			expiresAt: ctx.session.expiresAt,
		};
	}),

	login: publicProcedure.input(pinInput).mutation(async ({ ctx, input }) => {
		console.log("[AUTH][login] start", { ip: ctx.ip, ua: ctx.userAgent });
		if (await isBlocked(ctx.ip)) {
			console.log("[AUTH][login] blocked");
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: "Trop de tentatives. Réessayez dans 30 minutes.",
			});
		}

		const ok = await verifyCurrentPin(input.pin);
		console.log("[AUTH][login] verify", { ok });
		await recordAttempt(ctx.ip, ctx.userAgent, ok);

		if (!ok) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "PIN incorrect",
			});
		}

		const session = await createSession(ctx.ip, ctx.userAgent);
		console.log("[AUTH][login] session created", {
			sessionId: session.id.slice(0, 8),
			expiresAt: session.expiresAt,
		});
		ctx.setCookie(buildSessionSetCookie(session));
		console.log("[AUTH][login] done");

		return { ok: true as const };
	}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		await destroySession(ctx.session.id);
		ctx.setCookie(buildSessionClearCookie());
		return { ok: true as const };
	}),

	resetPin: publicProcedure
		.input(resetInput)
		.mutation(async ({ ctx, input }) => {
			if (await isBlocked(ctx.ip)) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message: "Trop de tentatives. Réessayez dans 30 minutes.",
				});
			}

			const ok = verifyMasterPin(input.masterPin);
			await recordAttempt(ctx.ip, ctx.userAgent, ok);

			if (!ok) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Master PIN incorrect",
				});
			}

			if (!isValidPinFormat(input.newPin)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Le nouveau PIN doit contenir 6 chiffres",
				});
			}

			await setNewPin(input.newPin, {
				ip: ctx.ip,
				userAgent: ctx.userAgent,
			});

			return { ok: true as const };
		}),
} satisfies TRPCRouterRecord;
