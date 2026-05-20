import { Readable } from "node:stream";

import { monthFolderName, yearFolderName } from "#/server/time/montreal.ts";

import { getDrive, getRootFolderId } from "./auth.ts";
import { type RegistryType, registryFolderName } from "./registry.ts";

const FOLDER_MIME = "application/vnd.google-apps.folder";

function escapeForQuery(s: string): string {
	return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

async function findFolder(
	parentId: string,
	name: string,
): Promise<string | null> {
	const drive = getDrive();
	const q = [
		`${escapeForQuery(parentId)} in parents`,
		`name = ${escapeForQuery(name)}`,
		`mimeType = '${FOLDER_MIME}'`,
		"trashed = false",
	].join(" and ");

	const res = await drive.files.list({
		q,
		fields: "files(id, name)",
		pageSize: 1,
	});
	return res.data.files?.[0]?.id ?? null;
}

async function createFolder(parentId: string, name: string): Promise<string> {
	const drive = getDrive();
	const res = await drive.files.create({
		requestBody: {
			name,
			mimeType: FOLDER_MIME,
			parents: [parentId],
		},
		fields: "id",
	});
	if (!res.data.id) {
		throw new Error(`Failed to create folder "${name}"`);
	}
	return res.data.id;
}

export async function ensureFolder(
	parentId: string,
	name: string,
): Promise<string> {
	const existing = await findFolder(parentId, name);
	if (existing) return existing;
	return createFolder(parentId, name);
}

export type RegistryPath = {
	registryFolderId: string;
	yearFolderId: string;
	monthFolderId: string;
};

export async function ensureRegistryPath(
	type: RegistryType,
	date: Date,
): Promise<RegistryPath> {
	const root = getRootFolderId();
	const registryFolderId = await ensureFolder(root, registryFolderName(type));
	const yearFolderId = await ensureFolder(
		registryFolderId,
		yearFolderName(date),
	);
	const monthFolderId = await ensureFolder(yearFolderId, monthFolderName(date));
	return { registryFolderId, yearFolderId, monthFolderId };
}

export type UploadedPhoto = {
	id: string;
	webViewLink: string;
};

export async function uploadPhoto(
	folderId: string,
	filename: string,
	buffer: Buffer,
): Promise<UploadedPhoto> {
	const drive = getDrive();
	const res = await drive.files.create({
		requestBody: {
			name: filename,
			parents: [folderId],
		},
		media: {
			mimeType: "image/webp",
			body: Readable.from(buffer),
		},
		fields: "id, webViewLink",
	});
	if (!res.data.id || !res.data.webViewLink) {
		throw new Error("Drive upload returned no id or link");
	}
	return { id: res.data.id, webViewLink: res.data.webViewLink };
}
