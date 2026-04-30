export const SESSION_COOKIE_NAME = "session";

type CookieOptions = {
	maxAge?: number;
	expires?: Date;
	path?: string;
	domain?: string;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: "Strict" | "Lax" | "None";
};

export function parseCookies(header: string | null): Record<string, string> {
	if (!header) return {};
	const out: Record<string, string> = {};
	for (const pair of header.split(";")) {
		const idx = pair.indexOf("=");
		if (idx < 0) continue;
		const name = pair.slice(0, idx).trim();
		const value = pair.slice(idx + 1).trim();
		if (name) out[name] = decodeURIComponent(value);
	}
	return out;
}

export function serializeCookie(
	name: string,
	value: string,
	options: CookieOptions = {},
): string {
	const parts = [`${name}=${encodeURIComponent(value)}`];
	if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
	if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
	parts.push(`Path=${options.path ?? "/"}`);
	if (options.domain) parts.push(`Domain=${options.domain}`);
	if (options.secure ?? true) parts.push("Secure");
	if (options.httpOnly ?? true) parts.push("HttpOnly");
	parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
	return parts.join("; ");
}
