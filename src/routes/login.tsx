import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { LockKeyholeIcon } from "lucide-react";
import { useRef, useState } from "react";

import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "#/components/ui/input-otp";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	beforeLoad: async ({ context }) => {
		console.log("[AUTH][login] beforeLoad start");
		const me = await context.queryClient.fetchQuery(
			context.trpc.auth.me.queryOptions(),
		);
		console.log("[AUTH][login] beforeLoad me=", me);
		if (me.authenticated) throw redirect({ to: "/registre" });
	},
});

function LoginPage() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [pin, setPin] = useState("");
	const [error, setError] = useState<string | null>(null);
	const tapTimes = useRef<number[]>([]);

	const login = useMutation(
		trpc.auth.login.mutationOptions({
			onSuccess: async (data) => {
				console.log("[AUTH][login.tsx] onSuccess", data);
				queryClient.removeQueries({ queryKey: trpc.auth.me.queryKey() });
				console.log("[AUTH][login.tsx] cache cleared, navigating to /registre");
				await navigate({ to: "/registre" });
				console.log("[AUTH][login.tsx] navigate resolved");
			},
			onError: (err) => {
				console.log("[AUTH][login.tsx] onError", err);
				setError(err.message);
				setPin("");
			},
		}),
	);

	function handleHiddenTap() {
		const now = Date.now();
		tapTimes.current = [...tapTimes.current, now].filter(
			(t) => now - t < 3000,
		);
		if (tapTimes.current.length >= 7) {
			tapTimes.current = [];
			navigate({ to: "/reset" });
		}
	}

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
			<button
				type="button"
				onClick={handleHiddenTap}
				className="rounded-full p-3"
				aria-label="Connexion"
			>
				<LockKeyholeIcon className="size-10 text-muted-foreground" />
			</button>
			<h1 className="text-xl font-medium">Entrez votre code PIN</h1>

			<InputOTP
				maxLength={6}
				pattern={REGEXP_ONLY_DIGITS}
				inputMode="numeric"
				value={pin}
				onChange={(v) => {
					setError(null);
					setPin(v);
				}}
				onComplete={(value) => login.mutate({ pin: value })}
				disabled={login.isPending}
				autoFocus
			>
				<InputOTPGroup className="gap-2 [&>div]:size-12 [&>div]:rounded-md [&>div]:border [&>div]:text-lg">
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
					<InputOTPSlot index={3} />
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>

			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}
			{login.isPending && (
				<p className="text-sm text-muted-foreground">Vérification…</p>
			)}
		</div>
	);
}
