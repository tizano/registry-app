import { ArrowLeftIcon } from "lucide-react";

export function MeasureHeader({
	title,
	onBack,
	disabled,
}: {
	title: string;
	onBack: () => void;
	disabled?: boolean;
}) {
	return (
		<header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md">
			<div className="flex items-center gap-1 px-3 pt-2.5 pb-2.5">
				<button
					type="button"
					onClick={onBack}
					disabled={disabled}
					aria-label="Retour"
					className="flex size-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
				>
					<ArrowLeftIcon className="size-4.5" />
				</button>
				<div className="min-w-0 flex-1">
					<div className="text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-slate-500">
						Nouveau registre
					</div>
					<h1 className="mt-0.5 text-base font-semibold tracking-[-0.005em] leading-tight">
						{title}
					</h1>
				</div>
			</div>
		</header>
	);
}

export function StickySubmit({
	disabled,
	submitting,
	onSubmit,
	label = "Enregistrer",
	pendingLabel = "Enregistrement…",
}: {
	disabled: boolean;
	submitting: boolean;
	onSubmit: () => void;
	label?: string;
	pendingLabel?: string;
}) {
	return (
		<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-50 via-slate-50 to-transparent px-5 pt-3 pb-9">
			<button
				type="button"
				onClick={onSubmit}
				disabled={disabled}
				className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 text-[15px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
			>
				{submitting ? pendingLabel : label}
			</button>
		</div>
	);
}
