import { createFileRoute, Navigate } from "@tanstack/react-router";

import { useAuthGuard } from "#/lib/auth-guard";

export const Route = createFileRoute("/")({
	component: HomeRedirect,
});

function HomeRedirect() {
	const guard = useAuthGuard();
	if (guard.state === "loading") return null;
	return (
		<Navigate
			to={guard.state === "authenticated" ? "/registre" : "/login"}
		/>
	);
}
