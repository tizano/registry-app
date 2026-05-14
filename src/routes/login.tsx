import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { LockKeyholeIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "#/components/ui/input-otp";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/login")({
	beforeLoad: async ({ context }) => {
		const me = await context.queryClient.ensureQueryData(
			context.trpc.auth.me.queryOptions(),
		);
		if (me.authenticated) throw redirect({ to: "/registre" });
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [pin, setPin] = useState("");
	const tapTimes = useRef<number[]>([]);

	const login = useMutation(
		trpc.auth.login.mutationOptions({
			onSuccess: async () => {
				queryClient.removeQueries({ queryKey: trpc.auth.me.queryKey() });
				await navigate({ to: "/registre" });
			},
			onError: (err) => {
				toast.error(err.message);
				setPin("");
			},
		}),
	);

	function handleHiddenTap() {
		const now = Date.now();
		tapTimes.current = [...tapTimes.current, now].filter((t) => now - t < 3000);
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
					setPin(v);
				}}
				onComplete={(value) => login.mutate({ pin: value })}
				disabled={login.isPending}
				autoFocus
			>
				<InputOTPGroup className="gap-2 [&>div]:size-12 [&>div]:rounded-md [&>div]:border [&>div]:text-lg">
					{Array.from({ length: 6 }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: index is stable here
						<InputOTPSlot key={i} index={i} />
					))}
				</InputOTPGroup>
			</InputOTP>

			{login.isPending && (
				<p className="text-sm text-muted-foreground">Vérification…</p>
			)}
		</div>
	);
}
