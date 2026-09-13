# Architecture

## Vue d’ensemble

```
index.js                 Point d’entrée (expo-router/entry)
app/                     Routes (expo-router)
ui/                      Design system : thème + primitives sans logique métier
components/              Composants métier, organisés par domaine
services/                Accès au monde extérieur (API, fichiers, analytics, queues)
stores/                  État persistant (Zustand + MMKV)
hooks/                   Hooks de données et utilitaires React
```

Règle de dépendance unidirectionnelle :

```
app/  →  components/  →  ui/
  ↓           ↓
hooks/  →  services/  →  stores/
```

`ui/` ne connaît ni l’API ni les écrans (exceptions : `ErrorState` / `ApiError`,
`AnimatedPressable` / haptique).

## Boot

`app/_layout.tsx` :

1. `SplashScreen.preventAutoHideAsync`
2. Splash JS (`BootSplash`) selon préférence logo kawaii (MMKV sync)
3. Chargement polices → `AppProviders` (Query persist + thème + `QueueBootstrap`)
4. `Stack.Protected` : `bienvenue` (consent) → `connexion` (prompt sign-in) → app

`QueueBootstrap` remet les jobs `running` orphelins en `pending` et relance les pumps DL/FTP.

## Routes (état ~v1.0.9+)

```
app/
├── _layout.tsx
├── bienvenue.tsx / connexion.tsx / compte.tsx
├── (tabs)/
│   ├── index.tsx            Accueil (stats, actus, populaires…)
│   ├── catalogue.tsx
│   ├── ftp.tsx              Profils FTP + file d’envoi
│   ├── recherche.tsx
│   └── profil.tsx
├── ressource/[id].tsx
├── guides/index.tsx | [id].tsx
├── favoris.tsx | historique.tsx
├── listes/index.tsx | [id].tsx
├── notifications.tsx        Inbox forum (opt-in)
├── profil/[id].tsx          Profil public
├── forum/… | actualites.tsx
├── parametres.tsx | a-propos.tsx | widgets.tsx (aperçu / bientôt)
└── +not-found.tsx
```

Deep links : `docs/deep-links.md` (`lbxmb://`, App Links).

## Couche réseau

| Fichier | Rôle |
|---|---|
| `client.ts` | Timeout, `ApiError`, headers CF (`UA` + `X-LBXMB-Client`) |
| `config.ts` | Base URL, UA app |
| `types.ts` / `normalize.ts` / `endpoints.ts` / `urls.ts` | Domaine + normalisation |

Voir `docs/api.md` et `docs/cloudflare-app-ua.md` pour auth / WAF.

L’API mélange JSON-dans-string et noms de champs variables : **toute** donnée UI passe
par `normalize.ts`.

## Auth (hybride)

- Mot de passe / register : Better Auth in-app
- Discord / « continuer sur le site » : challenge `qr/*` + page `/app/autoriser`
- Session : `stores/session.ts` (`lbxmb.session`, token Bearer en MMKV — pas SecureStore)

## État persistant

| Store | Clé | Contenu |
|---|---|---|
| `settings` | `lbxmb.settings` | Thème, consent, layout catalogue, haptique, notifs DL, inbox, app lock, langue, kawaii logo, lastSeenAppVersion |
| `session` | `lbxmb.session` | Token + prompt sign-in |
| `favorites` | `lbxmb.favorites` | Instantanés hors-ligne |
| `history` | `lbxmb.history` | Téléchargements / recherches récents |
| `downloadQueue` | `lbxmb.downloadQueue` | File DL (pending/running/done/error) |
| `ftp` | `lbxmb.ftp` | Profils + file d’upload (mdp dans SecureStore `ftp.password.*`) |
| `collections` | `lbxmb.collections` | Listes locales |
| `cataloguePrefs` | `lbxmb.cataloguePrefs` | Filtres mémorisés |

## Téléchargements et FTP

- **DL** : `services/download.ts` + file `downloadQueue` (pump one-at-a-time, notifs optionnelles)
- **FTP** : `ftp-ts` (+ stub Metro SFTP) via shims `net`/`tls` ; uploads via `ftpUploadQueue`
- Cold start : `running` → `pending` (partialize/merge + `recover*AfterCrash`)

## Cache requêtes

TanStack Query : `staleTime` 2 min ; persist sélectif fiches/guides (`queryPersist.ts`).
404 non retenté. Catalogue = `useInfiniteQuery` (pages 24).

## Analytics / i18n / thème

- Umami seulement si `consent === 'full'`
- i18n FR/EN (`i18n/`) — couverture partielle, strings FR encore en dur (voir `docs/i18n-audit.md`)
- Thème dark-first via `ThemeProvider`

## Docs liées

- `api.md`, `cloudflare-app-ua.md`, `qa-auth.md`
- `deep-links.md`, `widgets.md`, `passkeys.md`, `push-backend.md`, `release.md`
- `app-changelog.md` (+ miroir `services/appChangelogData.ts`)
