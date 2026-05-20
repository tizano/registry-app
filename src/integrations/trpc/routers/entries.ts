import type { TRPCRouterRecord } from "@trpc/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/index.ts";
import { phEntries, temperatureEntries } from "#/db/schema.ts";
import { protectedProcedure } from "../init";

const recentInput = z
	.object({
		limit: z.number().int().min(1).max(50).default(10),
	})
	.default({ limit: 10 });

export type RecentEntry =
	| {
			type: "ph";
			id: number;
			value: number;
			note: string | null;
			capturedAt: Date;
			sheetSynced: boolean;
	  }
	| {
			type: "temperature";
			id: number;
			valueC: number;
			valueF: number;
			unit: "C" | "F";
			note: string | null;
			capturedAt: Date;
			sheetSynced: boolean;
	  };

export const entriesRouter = {
	recent: protectedProcedure.input(recentInput).query(async ({ input }) => {
		const [phs, temps] = await Promise.all([
			db
				.select({
					id: phEntries.id,
					value: phEntries.value,
					note: phEntries.note,
					capturedAt: phEntries.capturedAt,
					sheetSynced: phEntries.sheetRowSynced,
				})
				.from(phEntries)
				.orderBy(desc(phEntries.capturedAt))
				.limit(input.limit),
			db
				.select({
					id: temperatureEntries.id,
					valueC: temperatureEntries.valueC,
					valueF: temperatureEntries.valueF,
					unit: temperatureEntries.unit,
					note: temperatureEntries.note,
					capturedAt: temperatureEntries.capturedAt,
					sheetSynced: temperatureEntries.sheetRowSynced,
				})
				.from(temperatureEntries)
				.orderBy(desc(temperatureEntries.capturedAt))
				.limit(input.limit),
		]);

		const merged: RecentEntry[] = [
			...phs.map((r) => ({ type: "ph" as const, ...r })),
			...temps.map((r) => ({
				type: "temperature" as const,
				...r,
				unit: r.unit as "C" | "F",
			})),
		];
		merged.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
		return merged.slice(0, input.limit);
	}),
} satisfies TRPCRouterRecord;
