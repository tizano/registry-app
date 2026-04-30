import { eq } from "drizzle-orm";

import { db } from "#/db/index.ts";
import { phEntries, syncFailures, temperatureEntries } from "#/db/schema.ts";
import { ensureRegistryPath, uploadPhoto } from "#/server/google/drive.ts";
import {
	appendPhRow,
	appendTemperatureRow,
} from "#/server/google/sheets.ts";
import { processImage } from "#/server/image/process.ts";
import { withRetry } from "#/server/retry.ts";
import {
	normalizeTemperature,
	type TemperatureUnit,
} from "#/server/temperature/normalize.ts";
import {
	buildPhotoFilename,
	dateLabel,
	timeLabel,
} from "#/server/time/montreal.ts";

type UploadedAsset = {
	driveId: string;
	url: string;
	capturedAt: Date;
};

async function processAndUpload(
	type: "ph" | "temperature",
	photo: Buffer,
): Promise<UploadedAsset> {
	const capturedAt = new Date();
	const processed = await processImage(photo);
	const filename = buildPhotoFilename(capturedAt, processed.extension);

	const { monthFolderId } = await withRetry(() =>
		ensureRegistryPath(type, capturedAt),
	);

	const uploaded = await withRetry(() =>
		uploadPhoto(monthFolderId, filename, processed.buffer),
	);

	return {
		driveId: uploaded.id,
		url: uploaded.webViewLink,
		capturedAt,
	};
}

export async function createPhEntry(args: {
	photo: Buffer;
	note: string | null;
}): Promise<{ id: number; photoUrl: string; sheetSynced: boolean }> {
	const asset = await processAndUpload("ph", args.photo);

	const [row] = await db
		.insert(phEntries)
		.values({
			note: args.note,
			photoDriveId: asset.driveId,
			photoUrl: asset.url,
			capturedAt: asset.capturedAt,
		})
		.returning({ id: phEntries.id });

	let sheetSynced = false;
	try {
		await withRetry(() =>
			appendPhRow(asset.capturedAt, {
				dateLabel: dateLabel(asset.capturedAt),
				timeLabel: timeLabel(asset.capturedAt),
				note: args.note ?? "",
				photoLink: asset.url,
			}),
		);
		await db
			.update(phEntries)
			.set({ sheetRowSynced: true })
			.where(eq(phEntries.id, row.id));
		sheetSynced = true;
	} catch (err) {
		await db.insert(syncFailures).values({
			entryType: "ph",
			entryId: row.id,
			target: "sheet",
			error: errorMessage(err),
			attempts: 3,
		});
	}

	return { id: row.id, photoUrl: asset.url, sheetSynced };
}

export async function createTemperatureEntry(args: {
	photo: Buffer;
	value: number;
	unit: TemperatureUnit;
	note: string | null;
}): Promise<{ id: number; photoUrl: string; sheetSynced: boolean }> {
	const asset = await processAndUpload("temperature", args.photo);
	const { valueC, valueF, unit } = normalizeTemperature(args.value, args.unit);

	const [row] = await db
		.insert(temperatureEntries)
		.values({
			valueC,
			valueF,
			unit,
			note: args.note,
			photoDriveId: asset.driveId,
			photoUrl: asset.url,
			capturedAt: asset.capturedAt,
		})
		.returning({ id: temperatureEntries.id });

	let sheetSynced = false;
	try {
		await withRetry(() =>
			appendTemperatureRow(asset.capturedAt, {
				dateLabel: dateLabel(asset.capturedAt),
				timeLabel: timeLabel(asset.capturedAt),
				valueC,
				valueF,
				note: args.note ?? "",
				photoLink: asset.url,
			}),
		);
		await db
			.update(temperatureEntries)
			.set({ sheetRowSynced: true })
			.where(eq(temperatureEntries.id, row.id));
		sheetSynced = true;
	} catch (err) {
		await db.insert(syncFailures).values({
			entryType: "temperature",
			entryId: row.id,
			target: "sheet",
			error: errorMessage(err),
			attempts: 3,
		});
	}

	return { id: row.id, photoUrl: asset.url, sheetSynced };
}

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	try {
		return JSON.stringify(err);
	} catch {
		return String(err);
	}
}
