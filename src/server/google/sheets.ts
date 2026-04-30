import { monthFolderName, yearFolderName } from "#/server/time/montreal.ts";

import { getDrive, getRootFolderId, getSheets } from "./auth.ts";
import { ensureFolder } from "./drive.ts";
import {
	type RegistryType,
	registryFolderName,
	spreadsheetName,
} from "./registry.ts";

const SPREADSHEET_MIME = "application/vnd.google-apps.spreadsheet";

const ANNEXE_SHEET_TITLE = "00-Annexe";
const ANNEXE_IMAGE_PATH = "/images/mockup-app-web.png";
const ANNEXE_IMAGE_ROW_HEIGHT = 320;
const ANNEXE_IMAGE_COL_WIDTH = 480;

const HEADERS_BY_TYPE = {
	ph: ["Date", "Heure", "Note", "Lien photo"],
	temperature: [
		"Date",
		"Heure",
		"Température (°C)",
		"Température (°F)",
		"Note",
		"Lien photo",
	],
} as const;

function lastColumn(type: RegistryType): string {
	const n = HEADERS_BY_TYPE[type].length;
	return String.fromCharCode("A".charCodeAt(0) + n - 1);
}

const MONTHS_FR = [
	"01-Janvier",
	"02-Février",
	"03-Mars",
	"04-Avril",
	"05-Mai",
	"06-Juin",
	"07-Juillet",
	"08-Août",
	"09-Septembre",
	"10-Octobre",
	"11-Novembre",
	"12-Décembre",
] as const;

function escapeForQuery(s: string): string {
	return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function getAppUrl(): string | null {
	const url = process.env.APP_URL?.trim();
	return url ? url.replace(/\/$/, "") : null;
}

async function findSpreadsheet(
	parentId: string,
	name: string,
): Promise<string | null> {
	const drive = getDrive();
	const q = [
		`${escapeForQuery(parentId)} in parents`,
		`name = ${escapeForQuery(name)}`,
		`mimeType = '${SPREADSHEET_MIME}'`,
		"trashed = false",
	].join(" and ");

	const res = await drive.files.list({
		q,
		fields: "files(id, name)",
		pageSize: 1,
	});
	return res.data.files?.[0]?.id ?? null;
}

async function populateAnnexe(
	spreadsheetId: string,
	sheetId: number | null | undefined,
	type: RegistryType,
): Promise<void> {
	const sheets = getSheets();
	const appUrl = getAppUrl();
	const registryName = registryFolderName(type);

	const rows: string[][] = [
		[`📋 ${registryName}`],
		["Fichier généré automatiquement par l'application web."],
	];
	if (appUrl) {
		rows.push([`=HYPERLINK("${appUrl}", "Ouvrir l'application →")`]);
		rows.push([""]);
		rows.push([`=IMAGE("${appUrl}${ANNEXE_IMAGE_PATH}")`]);
	}

	await sheets.spreadsheets.values.update({
		spreadsheetId,
		range: `${ANNEXE_SHEET_TITLE}!A1`,
		valueInputOption: "USER_ENTERED",
		requestBody: { values: rows },
	});

	if (appUrl && sheetId !== undefined && sheetId !== null) {
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: {
				requests: [
					{
						updateDimensionProperties: {
							range: {
								sheetId,
								dimension: "ROWS",
								startIndex: 4,
								endIndex: 5,
							},
							properties: { pixelSize: ANNEXE_IMAGE_ROW_HEIGHT },
							fields: "pixelSize",
						},
					},
					{
						updateDimensionProperties: {
							range: {
								sheetId,
								dimension: "COLUMNS",
								startIndex: 0,
								endIndex: 1,
							},
							properties: { pixelSize: ANNEXE_IMAGE_COL_WIDTH },
							fields: "pixelSize",
						},
					},
				],
			},
		});
	}
}

async function ensureAnnexeSheet(
	spreadsheetId: string,
	type: RegistryType,
): Promise<void> {
	const sheets = getSheets();
	const meta = await sheets.spreadsheets.get({
		spreadsheetId,
		fields: "sheets.properties(sheetId,title)",
	});
	const exists = meta.data.sheets?.some(
		(s) => s.properties?.title === ANNEXE_SHEET_TITLE,
	);
	if (exists) return;

	const updateRes = await sheets.spreadsheets.batchUpdate({
		spreadsheetId,
		requestBody: {
			requests: [
				{
					addSheet: {
						properties: { title: ANNEXE_SHEET_TITLE, index: 0 },
					},
				},
			],
		},
	});
	const sheetId =
		updateRes.data.replies?.[0]?.addSheet?.properties?.sheetId ?? null;

	await populateAnnexe(spreadsheetId, sheetId, type);
}

async function createSpreadsheet(
	parentId: string,
	name: string,
	type: RegistryType,
): Promise<string> {
	const sheets = getSheets();
	const drive = getDrive();
	const headers = HEADERS_BY_TYPE[type];
	const lastCol = lastColumn(type);
	const allTitles = [ANNEXE_SHEET_TITLE, ...MONTHS_FR];

	const created = await sheets.spreadsheets.create({
		requestBody: {
			properties: { title: name, locale: "fr_CA", timeZone: "America/Toronto" },
			sheets: allTitles.map((title) => ({ properties: { title } })),
		},
		fields: "spreadsheetId,sheets.properties(sheetId,title)",
	});
	const spreadsheetId = created.data.spreadsheetId;
	if (!spreadsheetId) throw new Error("Sheets create returned no id");

	const annexeSheetId =
		created.data.sheets?.find(
			(s) => s.properties?.title === ANNEXE_SHEET_TITLE,
		)?.properties?.sheetId ?? null;

	await sheets.spreadsheets.values.batchUpdate({
		spreadsheetId,
		requestBody: {
			valueInputOption: "RAW",
			data: MONTHS_FR.map((m) => ({
				range: `${m}!A1:${lastCol}1`,
				values: [headers as unknown as string[]],
			})),
		},
	});

	await populateAnnexe(spreadsheetId, annexeSheetId, type);

	await drive.files.update({
		fileId: spreadsheetId,
		addParents: parentId,
		fields: "id, parents",
	});

	return spreadsheetId;
}

async function ensureMonthSheet(
	spreadsheetId: string,
	monthSheetTitle: string,
	type: RegistryType,
): Promise<void> {
	const sheets = getSheets();
	const headers = HEADERS_BY_TYPE[type];
	const lastCol = lastColumn(type);

	const meta = await sheets.spreadsheets.get({
		spreadsheetId,
		fields: "sheets.properties(title)",
	});
	const exists = meta.data.sheets?.some(
		(s) => s.properties?.title === monthSheetTitle,
	);
	if (exists) return;

	await sheets.spreadsheets.batchUpdate({
		spreadsheetId,
		requestBody: {
			requests: [{ addSheet: { properties: { title: monthSheetTitle } } }],
		},
	});

	await sheets.spreadsheets.values.update({
		spreadsheetId,
		range: `${monthSheetTitle}!A1:${lastCol}1`,
		valueInputOption: "RAW",
		requestBody: { values: [headers as unknown as string[]] },
	});
}

export async function ensureSpreadsheet(
	type: RegistryType,
	date: Date,
): Promise<string> {
	const registryFolderId = await ensureFolder(
		getRootFolderId(),
		registryFolderName(type),
	);
	const year = yearFolderName(date);
	const name = spreadsheetName(type, year);

	const existing = await findSpreadsheet(registryFolderId, name);
	if (existing) return existing;
	return createSpreadsheet(registryFolderId, name, type);
}

export type TemperatureRow = {
	dateLabel: string;
	timeLabel: string;
	valueC: number;
	valueF: number;
	note: string;
	photoLink: string;
};

export type PhRow = {
	dateLabel: string;
	timeLabel: string;
	note: string;
	photoLink: string;
};

async function appendRow(
	type: RegistryType,
	date: Date,
	values: (string | number)[],
): Promise<void> {
	const sheets = getSheets();
	const spreadsheetId = await ensureSpreadsheet(type, date);
	const monthTitle = monthFolderName(date);
	const lastCol = lastColumn(type);

	await ensureAnnexeSheet(spreadsheetId, type);
	await ensureMonthSheet(spreadsheetId, monthTitle, type);

	await sheets.spreadsheets.values.append({
		spreadsheetId,
		range: `${monthTitle}!A:${lastCol}`,
		valueInputOption: "USER_ENTERED",
		insertDataOption: "INSERT_ROWS",
		requestBody: { values: [values] },
	});
}

export async function appendTemperatureRow(
	date: Date,
	row: TemperatureRow,
): Promise<void> {
	await appendRow("temperature", date, [
		row.dateLabel,
		row.timeLabel,
		row.valueC,
		row.valueF,
		row.note,
		row.photoLink,
	]);
}

export async function appendPhRow(date: Date, row: PhRow): Promise<void> {
	await appendRow("ph", date, [
		row.dateLabel,
		row.timeLabel,
		row.note,
		row.photoLink,
	]);
}
