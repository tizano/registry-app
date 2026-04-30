- Voir pour utiliser dayjs ou pas pour simplifier les dates/times/month etc... si pas de gros gain on peut rester comme ca
- Zod pour valider plus de type, comme les erreur dans driver/sheet
- Test fonctionnel/unitaire ?
- PR code rabbit pour tester
  ⏭️ Étape 7 — PWA manifest + icônes (dernière étape)
  Pour que l'app soit installable depuis Chrome/Safari mobile, il faut :

public/manifest.webmanifest — nom, icônes, theme_color, display: standalone
Icônes — au minimum 192×192 et 512×512 PNG (et idéalement maskable)
Service worker minimal (optionnel mais recommandé pour le critère "installable") — peut juste cacher l'app shell, on n'a pas besoin de cache offline (tu as dit connexion stable)

<link rel="manifest"> dans __root.tsx
Tu as des icônes prêtes (logo MAPAQ, logo de l'entreprise) ou je te génère un placeholder simple (lettre "M" sur fond coloré) qu'on pourra remplacer plus tard ?
