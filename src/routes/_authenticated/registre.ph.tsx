import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { MeasureHeader, StickySubmit } from "#/components/MeasureLayout";
import { PhotoCapture } from "#/components/PhotoCapture";

export const Route = createFileRoute("/_authenticated/registre/ph")({
	component: PhPage,
});

const PH_GRADIENT_STOPS = [
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#a3e635",
	"#22c55e",
	"#10b981",
	"#14b8a6",
	"#06b6d4",
	"#0ea5e9",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#d946ef",
];

function PhPage() {
	const navigate = useNavigate();
	const [value, setValue] = useState("");
	const [photo, setPhoto] = useState<File | null>(null);
	const [note, setNote] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const numericValue = Number(value.replace(",", "."));
	const valueValid =
		value.trim().length > 0 &&
		Number.isFinite(numericValue) &&
		numericValue >= 0 &&
		numericValue <= 14;

	const valid = Boolean(photo) && valueValid;

	async function submit() {
		if (!photo || !valueValid) return;
		setSubmitting(true);
		try {
			const form = new FormData();
			form.append("photo", photo);
			form.append("value", String(numericValue));
			if (note.trim()) form.append("note", note.trim());
			const res = await fetch("/api/registre/ph", {
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
				toast.success("Mesure de pH enregistrée.");
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
				title="Mesurer le pH"
				onBack={() => navigate({ to: "/registre" })}
				disabled={submitting}
			/>

			<main className="flex-1 overflow-y-auto px-5 pt-5 pb-32">
				<div>
					<label
						htmlFor="ph-value"
						className="text-[13px] font-medium text-slate-900"
					>
						Valeur du pH
					</label>
					<p className="mt-0.5 text-xs text-slate-500">
						Entre 0 (acide) et 14 (basique)
					</p>
					<div className="relative mt-2">
						<input
							id="ph-value"
							type="number"
							inputMode="decimal"
							step="0.1"
							min="0"
							max="14"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							disabled={submitting}
							placeholder="7.0"
							className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3.5 pr-12 text-[18px] font-semibold tabular-nums text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
						/>
						<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">
							pH
						</span>
					</div>
					<PhScale
						value={valueValid ? numericValue : 7}
						hasValue={valueValid}
						disabled={submitting}
						onChange={(v) => setValue(v.toFixed(1))}
					/>
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
						htmlFor="ph-note"
						className="text-[13px] font-medium text-slate-900"
					>
						Note{" "}
						<span className="font-normal text-slate-500">(optionnelle)</span>
					</label>
					<textarea
						id="ph-note"
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

const PH_STEP = 0.5;

function PhScale({
	value,
	hasValue,
	disabled,
	onChange,
}: {
	value: number;
	hasValue: boolean;
	disabled?: boolean;
	onChange: (next: number) => void;
}) {
	const gradient = useMemo(
		() => `linear-gradient(to right, ${PH_GRADIENT_STOPS.join(",")})`,
		[],
	);
	const trackRef = useRef<HTMLDivElement>(null);
	const pct = (Math.min(14, Math.max(0, value)) / 14) * 100;

	const commitFromClientX = (clientX: number) => {
		const track = trackRef.current;
		if (!track) return;
		const rect = track.getBoundingClientRect();
		if (rect.width <= 0) return;
		const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		const raw = ratio * 14;
		const snapped = Math.round(raw / PH_STEP) * PH_STEP;
		onChange(Math.min(14, Math.max(0, snapped)));
	};

	const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		e.preventDefault();
		e.currentTarget.setPointerCapture(e.pointerId);
		commitFromClientX(e.clientX);
	};
	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (disabled) return;
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			commitFromClientX(e.clientX);
		}
	};
	const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
	};
	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (disabled) return;
		let next: number | null = null;
		if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = value - PH_STEP;
		else if (e.key === "ArrowRight" || e.key === "ArrowUp")
			next = value + PH_STEP;
		else if (e.key === "Home") next = 0;
		else if (e.key === "End") next = 14;
		if (next === null) return;
		e.preventDefault();
		onChange(Math.min(14, Math.max(0, Math.round(next / PH_STEP) * PH_STEP)));
	};

	return (
		<div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
			<div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
				<span>Acide</span>
				<span>Neutre</span>
				<span>Basique</span>
			</div>
			<div
				ref={trackRef}
				role="slider"
				tabIndex={disabled ? -1 : 0}
				aria-label="Valeur du pH"
				aria-valuemin={0}
				aria-valuemax={14}
				aria-valuenow={hasValue ? value : undefined}
				aria-disabled={disabled || undefined}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				onKeyDown={onKeyDown}
				className={`relative h-2 rounded-full touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
					disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
				}`}
				style={{ background: gradient }}
			>
				<span
					className={
						"absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-white shadow"
					}
					style={{ left: `calc(${pct}% - 8px)` }}
				/>
			</div>
			<div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-500">
				<span>0</span>
				<span>7</span>
				<span>14</span>
			</div>
		</div>
	);
}
