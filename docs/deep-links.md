# Deep links

L’app écoute le schéma custom `lbxmb://` et les App Links / Universal Links vers
`https://lbxmb.fr`.

## Chemins supportés

| URL entrante | Route app |
|---|---|
| `lbxmb://ressource/{id}` | `/ressource/{id}` |
| `https://lbxmb.fr/ressources/{id}` | `/ressource/{id}` |
| `lbxmb://guide/{id}` | `/guides/{id}` |
| `https://lbxmb.fr/guides/{id}` | `/guides/{id}` |
| `lbxmb://forum/{id}` | `/forum/{id}` |
| `https://lbxmb.fr/forum/thread/{id}` (ou `/forum/post/{id}`) | `/forum/{id}` |
| `lbxmb://profil/{id}` | `/profil/{id}` |
| `https://lbxmb.fr/profil/{pseudo}` | `/profil/{pseudo}` |

Le mapping est dans `services/deepLinks.ts`, branché via `app/+native-intent.tsx`.

## Config native

- **Android** : `intentFilters` dans `app.config.ts` (https + scheme).
- **iOS** : `associatedDomains: applinks:lbxmb.fr`.

Un **prebuild** est requis après changement de cette config.

## Limites sideload

Les Universal Links iOS exigent un fichier Apple App Site Association (AASA) servi par
`lbxmb.fr` et un profil de provisioning qui inclut le domaine. En sideload / IPA ad-hoc,
les liens `https://` peuvent s’ouvrir dans Safari plutôt que l’app ; `lbxmb://` fonctionne
dès que l’app est installée.

Android App Links (verification) demandent aussi des assetlinks.json côté serveur ; sans
ça, l’intent filter « non vérifié » laisse l’utilisateur choisir l’app.
