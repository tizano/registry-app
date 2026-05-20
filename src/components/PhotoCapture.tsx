import { CameraIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function PhotoCapture({
	file,
	onChange,
	disabled,
}: {
	file: File | null;
	onChange: (f: File | null) => void;
	disabled?: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!file) {
			setPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	function openPicker() {
		inputRef.current?.click();
	}

	return (
		<div className="flex flex-col gap-2">
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="sr-only"
				disabled={disabled}
				onChange={(e) => {
					const f = e.target.files?.[0] ?? null;
					onChange(f);
					e.target.value = "";
				}}
			/>

			{previewUrl ? (
				<div className="space-y-2">
					<div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
						<img
							src={previewUrl}
							alt="Aperçu"
							className="aspect-4/3 w-full object-cover"
						/>
					</div>
					<button
						type="button"
						onClick={openPicker}
						disabled={disabled}
						className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[15px] font-medium text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
					>
						<RotateCcwIcon className="size-3.75" /> Reprendre
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={openPicker}
					disabled={disabled}
					className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 transition-all duration-150 hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
				>
					<span className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
						<CameraIcon className="size-5" />
					</span>
					<span className="text-sm font-medium text-slate-700">
						Prendre la photo
					</span>
					<span className="text-xs text-slate-500">
						Requis pour enregistrer
					</span>
				</button>
			)}
		</div>
	);
}
