import { parseCookies, SESSION_COOKIE_NAME } from "#/server/auth/cookie.ts";
import { getValidSession, type Session } from "#/server/auth/session.ts";

export type TRPCContext = {
	req: Request;
	resHeaders: Headers;
	ip: string;
	userAgent: string | null;
	session: Session | null;
	setCookie: (cookie: string) => void;
};

export async function createTRPCContext({
	req,
	resHeaders,
}: {
	req: Request;
	resHeaders: Headers;
}): Promise<TRPCContext> {
	const cookies = parseCookies(req.headers.get("cookie"));
	const session = await getValidSession(cookies[SESSION_COOKIE_NAME]);

	const ip =
		req.headers.get("cf-connecting-ip") ??
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		"unknown";

	const userAgent = req.headers.get("user-agent");

	return {
		req,
		resHeaders,
		ip,
		userAgent,
		session,
		setCookie: (cookie: string) => resHeaders.append("Set-Cookie", cookie),
	};
}
