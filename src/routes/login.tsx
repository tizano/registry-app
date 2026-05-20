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
		<div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
			<header className="flex items-center justify-between px-7 pt-6 pb-3">
				<span className="text-[11px] font-medium tracking-[0.22em] uppercase text-slate-500">
					MAPAQ
				</span>
				<span className="text-[11px] font-medium tracking-tight text-slate-500">
					{import.meta.env.VITE_APP_COMPANY_NAME}
				</span>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center px-7 -mt-12">
				<section className="max-w-2xl w-full">
					<button
						type="button"
						onClick={handleHiddenTap}
						aria-label="Connexion"
						className="mb-7 flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
					>
						<LockKeyholeIcon className="size-5" />
					</button>
					<h1 className="text-[22px] font-semibold tracking-[-0.01em] leading-tight">
						Entrez votre code PIN
					</h1>
					<p className="mt-1.5 text-sm leading-snug text-slate-500">
						Code à 6 chiffres pour accéder aux registres.
					</p>

					<InputOTP
						maxLength={6}
						pattern={REGEXP_ONLY_DIGITS}
						inputMode="numeric"
						value={pin}
						onChange={setPin}
						onComplete={(value) => login.mutate({ pin: value })}
						disabled={login.isPending}
						autoFocus
						containerClassName="mt-8"
					>
						<InputOTPGroup className="grid w-full grid-cols-6 gap-2 [&>div]:aspect-square [&>div]:h-auto [&>div]:w-full [&>div]:rounded-lg [&>div]:border [&>div]:border-slate-200 [&>div]:bg-white [&>div]:text-[20px] [&>div]:font-semibold [&>div]:tabular-nums [&>div]:text-slate-900">
							{Array.from({ length: 6 }, (_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: index is stable here
								<InputOTPSlot key={i} index={i} />
							))}
						</InputOTPGroup>
					</InputOTP>

					<p className="mt-3 text-[13px] text-slate-500">
						{login.isPending ? "Vérification…" : null}
					</p>
				</section>
			</main>
		</div>
	);
}
