import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ChevronRightIcon,
	DropletIcon,
	LogOutIcon,
	ThermometerIcon,
} from "lucide-react";
import { toast } from "sonner";

import { InstallPrompt } from "#/components/InstallPrompt";
import { useTRPC } from "#/integrations/trpc/react";
import type { RecentEntry } from "#/integrations/trpc/routers/entries";

export const Route = createFileRoute("/_authenticated/registre/")({
	component: RegistreIndex,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
	timeZone: "America/Montreal",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fr-CA", {
	timeZone: "America/Montreal",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

function isToday(date: Date): boolean {
	return dateFormatter.format(date) === dateFormatter.format(new Date());
}

function RegistreIndex() {
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const recentQuery = useQuery(trpc.entries.recent.queryOptions({ limit: 4 }));

	const logout = useMutation(
		trpc.auth.logout.mutationOptions({
			onSuccess: async () => {
				queryClient.removeQueries({ queryKey: trpc.auth.me.queryKey() });
				navigate({ to: "/login" });
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const entries = recentQuery.data ?? [];
	const phToday = entries.filter(
		(e) => e.type === "ph" && isToday(e.capturedAt),
	).length;
	const tempToday = entries.filter(
		(e) => e.type === "temperature" && isToday(e.capturedAt),
	).length;

	return (
		<div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
			<header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md">
				<div className="flex items-start justify-between px-5 pt-3 pb-3.5">
					<div>
						<span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
							MAPAQ
						</span>
						<h1 className="mt-0.5 text-[19px] font-semibold tracking-[-0.01em] leading-tight">
							Registres du labo
						</h1>
					</div>
					<button
						type="button"
						onClick={() => logout.mutate()}
						disabled={logout.isPending}
						aria-label="Se déconnecter"
						className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
					>
						<LogOutIcon className="size-4.5" />
					</button>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
				<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
					<RegistreCard
						icon={<DropletIcon className="size-4.5" />}
						title="Mesurer le pH"
						subtitle="Bandelette indicatrice — 0 à 14"
						meta={`${phToday} entrée${phToday > 1 ? "s" : ""} aujourd'hui`}
						onClick={() => navigate({ to: "/registre/ph" })}
					/>
					<RegistreCard
						icon={<ThermometerIcon className="size-4.5" />}
						title="Mesurer la température"
						subtitle="Indiquée sur la plonge — °C / °F"
						meta={`${tempToday} entrée${tempToday > 1 ? "s" : ""} aujourd'hui`}
						onClick={() => navigate({ to: "/registre/temperature" })}
					/>
				</div>

				<section className="mt-7">
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-[13px] font-medium">Activité récente</h2>
					</div>
					<div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
						{recentQuery.isLoading ? (
							<EmptyRow message="Chargement…" />
						) : entries.length === 0 ? (
							<EmptyRow
								message="Aucune mesure récente."
								hint="Choisissez un registre ci-dessus pour commencer."
							/>
						) : (
							entries
								.slice(0, 4)
								.map((entry) => (
									<RecentRow key={`${entry.type}-${entry.id}`} entry={entry} />
								))
						)}
					</div>
				</section>

				<InstallPrompt />
			</main>
		</div>
	);
}

function RegistreCard({
	icon,
	title,
	subtitle,
	meta,
	onClick,
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	meta: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-150 hover:border-slate-300 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
		>
			<div className="flex items-start justify-between">
				<div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
					{icon}
				</div>
				<ChevronRightIcon className="mt-1.5 size-4 text-slate-300 transition-colors group-hover:text-slate-500" />
			</div>
			<div className="mt-3">
				<div className="text-[15px] font-semibold tracking-[-0.005em]">
					{title}
				</div>
				<div className="mt-0.5 text-[13px] leading-snug text-slate-500">
					{subtitle}
				</div>
			</div>
			<div className="mt-3 border-t border-slate-100 pt-3 text-[12px] tabular-nums text-slate-500">
				{meta}
			</div>
		</button>
	);
}

function EmptyRow({ message, hint }: { message: string; hint?: string }) {
	return (
		<div className="px-4 py-10 text-center">
			<p className="text-[13px] text-slate-500">{message}</p>
			{hint ? (
				<p className="mt-0.5 text-[12px] text-slate-400">{hint}</p>
			) : null}
		</div>
	);
}

function RecentRow({ entry }: { entry: RecentEntry }) {
	const valueLabel =
		entry.type === "ph"
			? entry.value.toFixed(1)
			: entry.unit === "F"
				? entry.valueF.toFixed(1)
				: entry.valueC.toFixed(1);

	return (
		<div className="flex items-center gap-3 px-4 py-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
				{entry.type === "ph" ? (
					<DropletIcon className="size-3.75" />
				) : (
					<ThermometerIcon className="size-3.75" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<div className="truncate text-[13px] font-medium">
					{entry.type === "ph" ? "pH" : "Température"} -{" "}
					<span className="tabular-nums">{valueLabel}</span>
					{entry.type === "temperature" ? (
						<span className="text-slate-500"> °{entry.unit}</span>
					) : null}
				</div>
				<div className="truncate text-[11px] text-slate-500">
					Pris le {dateFormatter.format(entry.capturedAt)} à{" "}
					{timeFormatter.format(entry.capturedAt)}
				</div>
			</div>
			<span
				className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
					entry.sheetSynced
						? "bg-emerald-50 text-emerald-700"
						: "bg-amber-50 text-amber-700"
				}`}
			>
				{entry.sheetSynced ? "Sync" : "En attente"}
			</span>
		</div>
	);
}
