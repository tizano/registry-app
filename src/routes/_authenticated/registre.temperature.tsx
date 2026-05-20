import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { MeasureHeader, StickySubmit } from "#/components/MeasureLayout";
import { PhotoCapture } from "#/components/PhotoCapture";

export const Route = createFileRoute("/_authenticated/registre/temperature")({
	component: TemperaturePage,
});

function TemperaturePage() {
	const navigate = useNavigate();
	const [value, setValue] = useState("");
	const [unit, setUnit] = useState<"C" | "F">("C");
	const [photo, setPhoto] = useState<File | null>(null);
	const [note, setNote] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const numericValue = Number(value.replace(",", "."));
	const valueValid = Number.isFinite(numericValue) && value.trim().length > 0;
	const valid = Boolean(photo) && valueValid;

	async function submit() {
		if (!photo || !valueValid) return;
		setSubmitting(true);
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
				toast.warning(
					"Saisie enregistrée, mais la synchro Google Sheets a échoué. Un admin pourra rejouer la synchro plus tard.",
				);
			} else {
				toast.success("Température enregistrée.");
			}
			navigate({ to: "/registre" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erreur inconnue");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="relative flex min-h-dvh flex-col bg-slate-50 text-slate-900">
			<MeasureHeader
				title="Mesurer la température"
				onBack={() => navigate({ to: "/registre" })}
				disabled={submitting}
			/>

			<main className="flex-1 overflow-y-auto px-5 pt-5 pb-32">
				<div>
					<label
						htmlFor="temp-value"
						className="text-[13px] font-medium text-slate-900"
					>
						Température
					</label>
					<p className="mt-0.5 text-xs text-slate-500">
						Indiquée sur la plonge
					</p>
					<div className="mt-2 flex items-stretch gap-2">
						<div className="relative flex-1">
							<input
								id="temp-value"
								type="number"
								inputMode="decimal"
								step="0.1"
								value={value}
								onChange={(e) => setValue(e.target.value)}
								disabled={submitting}
								placeholder="180"
								className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-12 text-[18px] font-semibold tabular-nums text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
							/>
							<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">
								°{unit}
							</span>
						</div>
						<UnitToggle value={unit} onChange={setUnit} disabled={submitting} />
					</div>
				</div>

				<section className="mt-6">
					<div className="mb-2 flex items-baseline justify-between">
						<span className="text-[13px] font-medium">Photo de la mesure</span>
						<span className="text-[11px] font-medium text-rose-600">
							Requis
						</span>
					</div>
					<PhotoCapture
						file={photo}
						onChange={setPhoto}
						disabled={submitting}
					/>
				</section>

				<div className="mt-6">
					<label
						htmlFor="temp-note"
						className="text-[13px] font-medium text-slate-900"
					>
						Note{" "}
						<span className="font-normal text-slate-500">(optionnelle)</span>
					</label>
					<textarea
						id="temp-note"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						rows={3}
						maxLength={500}
						disabled={submitting}
						placeholder="Observation, valeur lue, conditions…"
						className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-snug text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
					/>
				</div>
			</main>

			<StickySubmit
				disabled={!valid || submitting}
				submitting={submitting}
				onSubmit={submit}
			/>
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
		<div className="inline-flex h-12 rounded-lg border border-slate-200 bg-white p-1">
			{(["C", "F"] as const).map((u) => (
				<button
					key={u}
					type="button"
					disabled={disabled}
					onClick={() => onChange(u)}
					aria-pressed={value === u}
					className={`rounded-md px-3 text-[13px] font-medium transition-colors ${
						value === u
							? "bg-slate-900 text-white"
							: "text-slate-500 hover:text-slate-900"
					}`}
				>
					°{u}
				</button>
			))}
		</div>
	);
}
