import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PhotoCapture } from "#/components/PhotoCapture";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/registre/ph")({
	component: PhPage,
});

function PhPage() {
	const navigate = useNavigate();
	const [photo, setPhoto] = useState<File | null>(null);
	const [note, setNote] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function submit() {
		if (!photo) return;
		setSubmitting(true);
		try {
			const form = new FormData();
			form.append("photo", photo);
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
				<h1 className="text-lg font-medium">Mesurer le pH</h1>
			</header>

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
					placeholder="Observation, valeur lue…"
				/>
			</div>

			<Button
				size="lg"
				className="mt-6"
				disabled={!photo || submitting}
				onClick={submit}
			>
				{submitting ? "Envoi…" : "Enregistrer"}
			</Button>
		</div>
	);
}
