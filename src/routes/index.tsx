import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: () => null,
	beforeLoad: async ({ context }) => {
		if (typeof document === "undefined") return;
		const me = await context.queryClient.fetchQuery(
			context.trpc.auth.me.queryOptions(),
		);
		throw redirect({ to: me.authenticated ? "/registre" : "/login" });
	},
});
