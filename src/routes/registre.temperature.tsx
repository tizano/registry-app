import {
	createFileRoute,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

import { PhotoCapture } from "#/components/PhotoCapture";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";

export const Route = createFileRoute("/registre/temperature")({
	component: TemperaturePage,
	beforeLoad: async ({ context }) => {
		const me = await context.queryClient.fetchQuery(
			context.trpc.auth.me.queryOptions(),
		);
		if (!me.authenticated) throw redirect({ to: "/login" });
	},
});

function TemperaturePage() {
	const navigate = useNavigate();
	const [value, setValue] = useState("");
	const [unit, setUnit] = useState<"C" | "F">("C");
	const [photo, setPhoto] = useState<File | null>(null);
	const [note, setNote] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const numericValue = Number(value.replace(",", "."));
	const valueValid = Number.isFinite(numericValue) && value.trim().length > 0;

	async function submit() {
		if (!photo || !valueValid) return;
		setSubmitting(true);
		setError(null);
		try {
			const form = new FormData();
			form.append("photo", photo);
			form.append("value", String(numericValue));
			form.append("unit", unit);
			if (note.trim()) form.append("note", note.trim());
			const res = await fetch("/api/registre/temperature", {
				method: "POST",
				body: form,
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(body?.error ?? `Erreur ${res.status}`);
			}
			const data = (await res.json()) as { sheetSynced: boolean };
			if (!data.sheetSynced) {
				setError(
					"Saisie enregistrée, mais la synchro Google Sheets a échoué. Un admin pourra rejouer la synchro plus tard.",
				);
				setSubmitting(false);
				return;
			}
			navigate({ to: "/registre" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-dvh flex-col p-6 gap-5">
			<header className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/registre" })}
					disabled={submitting}
					aria-label="Retour"
				>
					<ArrowLeftIcon />
				</Button>
				<h1 className="text-lg font-medium">Registre Température</h1>
			</header>

			<div className="flex flex-col gap-2">
				<Label htmlFor="value">Température</Label>
				<div className="flex gap-2">
					<Input
						id="value"
						type="text"
						inputMode="decimal"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						disabled={submitting}
						placeholder="0"
						className="flex-1 text-2xl h-14"
					/>
					<UnitToggle value={unit} onChange={setUnit} disabled={submitting} />
				</div>
			</div>

			<PhotoCapture file={photo} onChange={setPhoto} disabled={submitting} />

			<div className="flex flex-col gap-2">
				<Label htmlFor="note">Note (optionnelle)</Label>
				<Textarea
					id="note"
					value={note}
					onChange={(e) => setNote(e.target.value)}
					rows={3}
					maxLength={500}
					disabled={submitting}
				/>
			</div>

			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}

			<Button
				size="lg"
				className="mt-auto"
				disabled={!photo || !valueValid || submitting}
				onClick={submit}
			>
				{submitting ? "Envoi…" : "Enregistrer"}
			</Button>
		</div>
	);
}

function UnitToggle({
	value,
	onChange,
	disabled,
}: {
	value: "C" | "F";
	onChange: (v: "C" | "F") => void;
	disabled?: boolean;
}) {
	return (
		<div className="flex h-14 rounded-lg border bg-background p-1">
			{(["C", "F"] as const).map((u) => (
				<button
					key={u}
					type="button"
					disabled={disabled}
					onClick={() => onChange(u)}
					className={`flex-1 px-4 rounded-md text-base font-medium transition-colors ${
						value === u
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:bg-muted"
					}`}
					aria-pressed={value === u}
				>
					°{u}
				</button>
			))}
		</div>
	);
}
