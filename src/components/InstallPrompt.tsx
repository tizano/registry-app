import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "#/components/ui/button";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
	const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
		null,
	);
	const [installed, setInstalled] = useState(false);

	useEffect(() => {
		function onBeforeInstall(e: Event) {
			e.preventDefault();
			setDeferred(e as BeforeInstallPromptEvent);
		}
		function onInstalled() {
			setInstalled(true);
			setDeferred(null);
		}
		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		window.addEventListener("appinstalled", onInstalled);

		const standalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		if (standalone) setInstalled(true);

		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstall);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);

	if (installed || !deferred) return null;

	return (
		<Button
			variant="outline"
			size="lg"
			onClick={async () => {
				await deferred.prompt();
				const choice = await deferred.userChoice;
				if (choice.outcome === "accepted") setDeferred(null);
			}}
		>
			<DownloadIcon /> Installer l'application
		</Button>
	);
}
