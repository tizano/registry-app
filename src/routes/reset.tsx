import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "#/components/ui/input-otp";
import { Label } from "#/components/ui/label";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/reset")({
	component: ResetPage,
});

function PinField({
	id,
	value,
	onChange,
	disabled,
}: {
	id: string;
	value: string;
	onChange: (v: string) => void;
	disabled?: boolean;
}) {
	return (
		<InputOTP
			id={id}
			maxLength={6}
			pattern={REGEXP_ONLY_DIGITS}
			inputMode="numeric"
			value={value}
			onChange={onChange}
			disabled={disabled}
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
	);
}

function ResetPage() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [masterPin, setMasterPin] = useState("");
	const [newPin, setNewPin] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const reset = useMutation(
		trpc.auth.resetPin.mutationOptions({
			onSuccess: () => {
				setDone(true);
				setError(null);
			},
			onError: (err) => setError(err.message),
		}),
	);

	const canSubmit =
		masterPin.length === 6 && newPin.length === 6 && !reset.isPending;

	if (done) {
		return (
			<div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
				<h1 className="text-xl font-medium">PIN mis à jour</h1>
				<p className="text-sm text-muted-foreground text-center">
					Vous pouvez maintenant vous connecter avec le nouveau PIN.
				</p>
				<Button onClick={() => navigate({ to: "/login" })}>
					Retour à la connexion
				</Button>
			</div>
		);
	}

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
			<h1 className="text-xl font-medium">Réinitialiser le PIN</h1>

			<div className="flex flex-col items-center gap-3">
				<Label htmlFor="master-pin">PIN maître</Label>
				<PinField
					id="master-pin"
					value={masterPin}
					onChange={(v) => {
						setError(null);
						setMasterPin(v);
					}}
					disabled={reset.isPending}
				/>
			</div>

			<div className="flex flex-col items-center gap-3">
				<Label htmlFor="new-pin">Nouveau PIN</Label>
				<PinField
					id="new-pin"
					value={newPin}
					onChange={(v) => {
						setError(null);
						setNewPin(v);
					}}
					disabled={reset.isPending}
				/>
			</div>

			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}

			<div className="flex flex-col gap-2 w-full max-w-xs">
				<Button
					size="lg"
					disabled={!canSubmit}
					onClick={() => reset.mutate({ masterPin, newPin })}
				>
					{reset.isPending ? "Validation…" : "Valider"}
				</Button>
				<Button
					variant="ghost"
					onClick={() => navigate({ to: "/login" })}
					disabled={reset.isPending}
				>
					<ArrowLeftIcon /> Annuler
				</Button>
			</div>
		</div>
	);
}
