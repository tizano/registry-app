import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "#/integrations/trpc/context";
import { trpcRouter } from "#/integrations/trpc/router";

async function handler({ request }: { request: Request }) {
	try {
		const res = await fetchRequestHandler({
			req: request,
			router: trpcRouter,
			endpoint: "/api/trpc",
			createContext: ({ req, resHeaders }) =>
				createTRPCContext({ req, resHeaders }),
			onError: ({ error, path }) => {
				console.error("[trpc] error in", path, error);
			},
		});
		return res;
	} catch (err) {
		console.error("[trpc] handler crashed", err);
		return Response.json(
			{
				error: "Internal Server Error",
				message: err instanceof Error ? err.message : String(err),
			},
			{ status: 500 },
		);
	}
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: handler,
			POST: handler,
		},
	},
});
