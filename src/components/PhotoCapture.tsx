import { CameraIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";

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
		<div className="flex flex-col gap-3">
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
				<div className="flex flex-col gap-2">
					<img
						src={previewUrl}
						alt="Aperçu"
						className="w-full rounded-xl border object-cover max-h-[50dvh]"
					/>
					<Button
						type="button"
						variant="outline"
						size="lg"
						onClick={openPicker}
						disabled={disabled}
					>
						<RotateCcwIcon /> Reprendre la photo
					</Button>
				</div>
			) : (
				<Button
					type="button"
					size="lg"
					onClick={openPicker}
					disabled={disabled}
					className="h-32 flex-col gap-2 text-base"
				>
					<CameraIcon className="size-8" />
					Prendre la photo
				</Button>
			)}
		</div>
	);
}
