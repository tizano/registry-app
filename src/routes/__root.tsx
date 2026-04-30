import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "#/integrations/trpc/router";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;

	trpc: TRPCOptionsProxy<TRPCRouter>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content:
					"width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no",
			},
			{ name: "theme-color", content: "#000000" },
			{ name: "mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-status-bar-style", content: "default" },
			{ name: "apple-mobile-web-app-title", content: "Registre H et B" },
			{ name: "format-detection", content: "telephone=no" },
			{ title: "Registre H et B Événements - MAPAQ" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.json" },
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				href: "/logos/android/launchericon-192x192.png",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/logos/ios/180.png",
			},
		],
	}),
	shellComponent: RootDocument,
});

const SW_REGISTRATION = `
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(() => {});
	});
}
`;

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="fr-CA">
			<head>
				<HeadContent />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: minimal SW registration
					dangerouslySetInnerHTML={{ __html: SW_REGISTRATION }}
				/>
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
