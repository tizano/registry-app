import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		const me = await context.queryClient.ensureQueryData(
			context.trpc.auth.me.queryOptions(),
		);
		throw redirect({ to: me.authenticated ? "/registre" : "/login" });
	},
});
