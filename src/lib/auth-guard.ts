import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "#/integrations/trpc/react";

type AuthState =
	| { state: "loading" }
	| { state: "authenticated" }
	| { state: "unauthenticated" };

export function useAuthGuard(): AuthState {
	const trpc = useTRPC();
	const { data, isLoading } = useQuery(trpc.auth.me.queryOptions());

	if (isLoading || data === undefined) return { state: "loading" };
	if (!data.authenticated) return { state: "unauthenticated" };
	return { state: "authenticated" };
}
