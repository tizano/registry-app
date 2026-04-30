import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { CameraIcon, LogOutIcon, ThermometerIcon } from "lucide-react";

import { InstallPrompt } from "#/components/InstallPrompt";
import { Button } from "#/components/ui/button";
import { useTRPC } from "#/integrations/trpc/react";

export const Route = createFileRoute("/registre/")({
	component: RegistreIndex,
	beforeLoad: async ({ context }) => {
		console.log("[AUTH][registre/] beforeLoad start");
		const me = await context.queryClient.fetchQuery(
			context.trpc.auth.me.queryOptions(),
		);
		console.log("[AUTH][registre/] beforeLoad me=", me);
		if (!me.authenticated) throw redirect({ to: "/login" });
	},
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
		}),
	);

	return (
		<div className="flex min-h-dvh flex-col p-6 gap-6">
			<header className="flex items-center justify-between">
				<h1 className="text-lg font-medium">Registres MAPAQ</h1>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => logout.mutate()}
					disabled={logout.isPending}
					aria-label="Déconnexion"
				>
					<LogOutIcon />
				</Button>
			</header>

			<div className="flex flex-1 flex-col gap-4 justify-center">
				<RegistreCard
					title="Registre pH"
					subtitle="Photo + note"
					icon={<CameraIcon className="size-10" />}
					onClick={() => navigate({ to: "/registre/ph" })}
				/>
				<RegistreCard
					title="Registre Température"
					subtitle="Mesure + photo + note"
					icon={<ThermometerIcon className="size-10" />}
					onClick={() => navigate({ to: "/registre/temperature" })}
				/>
			</div>

			<InstallPrompt />
		</div>
	);
}

function RegistreCard({
	title,
	subtitle,
	icon,
	onClick,
}: {
	title: string;
	subtitle: string;
	icon: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-8 min-h-[40dvh] transition-colors hover:bg-muted active:bg-muted"
		>
			<div className="text-primary">{icon}</div>
			<div className="text-center">
				<div className="text-xl font-medium">{title}</div>
				<div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
			</div>
		</button>
	);
}
