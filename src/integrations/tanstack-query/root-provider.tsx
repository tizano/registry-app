import { TRPCProvider } from "#/integrations/trpc/react";
import type { TRPCRouter } from "#/integrations/trpc/router";
import { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { ReactNode } from "react";
import superjson from "superjson";

function getUrl() {
	if (typeof window !== "undefined") return "/api/trpc";

	if (process.env.APP_URL) {
		return `${process.env.APP_URL.replace(/\/$/, "")}/api/trpc`;
	}

	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}/api/trpc`;
	}

	return `http://localhost:${process.env.PORT ?? 3000}/api/trpc`;
}

const getServerHeaders = createIsomorphicFn()
	.client((): Record<string, string> => ({}))
	.server((): Record<string, string> => {
		const cookie = (getRequestHeaders() as unknown as Headers).get("cookie");
		return cookie ? { cookie } : {};
	});

export const trpcClient = createTRPCClient<TRPCRouter>({
	links: [
		httpBatchLink({
			transformer: superjson,
			url: getUrl(),
			headers: getServerHeaders,
		}),
	],
});

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			dehydrate: { serializeData: superjson.serialize },
			hydrate: { deserializeData: superjson.deserialize },
		},
	});

	const serverHelpers = createTRPCOptionsProxy({
		client: trpcClient,
		queryClient: queryClient,
	});
	const context = {
		queryClient,
		trpc: serverHelpers,
	};

	return context;
}

export default function TanstackQueryProvider({
	children,
	context,
}: {
	children: ReactNode;
	context: ReturnType<typeof getContext>;
}) {
	const { queryClient } = context;

	return (
		<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
			{children}
		</TRPCProvider>
	);
}
