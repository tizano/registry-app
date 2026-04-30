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
	const cookieHeader = req.headers.get("cookie");
	const cookies = parseCookies(cookieHeader);
	const sessionId = cookies[SESSION_COOKIE_NAME];
	const session = await getValidSession(sessionId);

	console.log("[AUTH][ctx]", {
		url: req.url,
		method: req.method,
		hasCookieHeader: cookieHeader != null,
		hasSessionCookie: sessionId != null,
		sessionFound: session != null,
	});

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
		setCookie: (cookie: string) => {
			console.log(
				"[AUTH][ctx] setCookie",
				cookie.slice(0, 80),
				"…",
			);
			resHeaders.append("Set-Cookie", cookie);
		},
	};
}
