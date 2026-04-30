import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "#/integrations/trpc/context";
import { trpcRouter } from "#/integrations/trpc/router";

async function handler({ request }: { request: Request }) {
	const res = await fetchRequestHandler({
		req: request,
		router: trpcRouter,
		endpoint: "/api/trpc",
		createContext: ({ req, resHeaders }) =>
			createTRPCContext({ req, resHeaders }),
	});

	const setCookie = res.headers.get("set-cookie");
	console.log("[AUTH][api] response", {
		url: request.url,
		status: res.status,
		hasSetCookie: setCookie != null,
		setCookieSnippet: setCookie?.slice(0, 80),
	});

	return res;
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: handler,
			POST: handler,
		},
	},
});
