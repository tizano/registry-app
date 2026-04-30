// Service worker minimal — uniquement pour rendre la PWA installable.
// Connexion supposée stable, donc pas de cache offline.

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
	// No-op: laisse le réseau gérer normalement.
});
