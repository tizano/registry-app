import type { drive_v3, sheets_v4 } from "googleapis";
import { google } from "googleapis";

const SCOPES = [
	"https://www.googleapis.com/auth/drive",
	"https://www.googleapis.com/auth/spreadsheets",
];

let cachedClient: InstanceType<typeof google.auth.OAuth2> | null = null;

export function getGoogleAuth() {
	if (cachedClient) return cachedClient;

	const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
	const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

	if (!clientId || !clientSecret || !refreshToken) {
		throw new Error(
			"Missing Google OAuth env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN",
		);
	}

	const oauth = new google.auth.OAuth2(clientId, clientSecret);
	oauth.setCredentials({ refresh_token: refreshToken, scope: SCOPES.join(" ") });
	cachedClient = oauth;
	return cachedClient;
}

export function getDrive(): drive_v3.Drive {
	return google.drive({ version: "v3", auth: getGoogleAuth() });
}

export function getSheets(): sheets_v4.Sheets {
	return google.sheets({ version: "v4", auth: getGoogleAuth() });
}

export function getRootFolderId(): string {
	const id = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
	if (!id) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not set");
	return id;
}
