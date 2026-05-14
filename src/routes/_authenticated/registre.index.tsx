import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

import { InstallPrompt } from "#/components/InstallPrompt";
import { Button } from "#/components/ui/button";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/_authenticated/registre/")({
	component: RegistreIndex,
});

function RegistreIndex() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const logout = useMutation(
		trpc.auth.logout.mutationOptions({
			onSuccess: async () => {
				queryClient.removeQueries({ queryKey: trpc.auth.me.queryKey() });
				navigate({ to: "/login" });
			},
			onError: (err) => {
				toast.error(err.message);
			},
		}),
	);

	return (
		<div className="flex min-h-dvh flex-col p-6 gap-6">
			<header className="flex items-center justify-between">
				<h1 className="text-xl font-medium">Registres MAPAQ</h1>
				<Button
					variant="ghost"
					size="icon-big"
					onClick={() => logout.mutate()}
					disabled={logout.isPending}
					aria-label="Déconnexion"
				>
					<LogOutIcon />
				</Button>
			</header>

			<div className="flex flex-col md:flex-row gap-4 justify-center md:items-center h-[calc(100dvh-108px)]">
				<RegistreCard
					title="Mesurer le pH"
					image="/images/ph.png"
					onClick={() => navigate({ to: "/registre/ph" })}
				/>
				<RegistreCard
					title="Mesurer la température"
					image="/images/thermo-laser.png"
					onClick={() => navigate({ to: "/registre/temperature" })}
				/>
			</div>

			<InstallPrompt />
		</div>
	);
}

function RegistreCard({
	title,
	image,
	onClick,
}: {
	title: string;
	image: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-8 min-h-[40dvh] transition-colors hover:bg-muted active:bg-muted min-w-1/3"
		>
			<picture>
				<img src={image} alt={title} className="size-40  object-cover" />
			</picture>
			<div className="text-center">
				<div className="text-xl font-medium">{title}</div>
			</div>
		</button>
	);
}
