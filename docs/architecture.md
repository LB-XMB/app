# Architecture

## Vue d’ensemble

```
index.js                 Point d’entrée (expo-router/entry)
app/                     Routes
ui/                      Design system : thème + primitives sans logique métier
components/              Composants métier, organisés par domaine
services/                Accès au monde extérieur (API, fichiers, analytics)
stores/                  État persistant
hooks/                   Hooks de données et utilitaires React
```

La règle de dépendance est unidirectionnelle :

```
app/  →  components/  →  ui/
  ↓           ↓
hooks/  →  services/  →  stores/
```

`ui/` ne connaît ni l’API ni les écrans (seule exception assumée : `ErrorState` lit
`ApiError` pour produire un message lisible, et `AnimatedPressable` lit le réglage
haptique).

## Routes

`app/_layout.tsx` charge les polices, masque le splash puis monte un `Stack`. Les routes
sont gardées par `Stack.Protected` : tant que le consentement n’a pas été donné, la seule
route atteignable est `bienvenue`.

```
app/
├── _layout.tsx              Providers + Stack + garde de consentement
├── bienvenue.tsx            Consentement du premier lancement
├── (tabs)/
│   ├── _layout.tsx          Tabs avec barre personnalisée
│   ├── index.tsx            Accueil
│   ├── catalogue.tsx        Catalogue filtrable
│   ├── recherche.tsx        Recherche globale
│   └── profil.tsx           Bibliothèque et réglages
├── ressource/[id].tsx       Fiche ressource
├── guides/index.tsx         Liste des guides
├── guides/[id].tsx          Guide (contenu rendu nativement)
├── favoris.tsx
├── historique.tsx
├── parametres.tsx
├── a-propos.tsx
└── +not-found.tsx
```

Les écrans de détail acceptent aussi bien un identifiant numérique qu’un slug : l’API
résout les deux.

## Couche réseau

`services/api/` sépare strictement le transport, les types et la normalisation.

| Fichier | Rôle |
|---|---|
| `client.ts` | `request()` : timeout, annulation, `ApiError` typée avec message utilisateur |
| `config.ts` | URL de base et liens du site, lus depuis `app.config.ts` |
| `types.ts` | Types de domaine consommés par l’UI |
| `normalize.ts` | Conversion des payloads bruts vers les types de domaine |
| `endpoints.ts` | Une fonction par endpoint |
| `urls.ts` | `uploadUrl()` et `siteUrl()` pour résoudre les médias |

### Pourquoi une couche de normalisation

L’API publique mélange les représentations : `pagination.total` est une chaîne,
`nb_telechargements` un nombre, et surtout `variantes`, `releases`, `tags` et `media_rendu`
contiennent du **JSON encodé dans une chaîne**. Les champs changent aussi de nom entre la
liste (`title`, `platform`) et le détail (`nom`, `console`).

`normalize.ts` absorbe ces écarts pour que les composants ne manipulent que des types
stables. Un champ inconnu n’entraîne jamais de crash : tout passe par `toStringOrNull`,
`toNumber` ou `toStringArray`.

### Arbre de téléchargement

Une ressource expose ses fichiers sous trois formes historiques :

1. `variantes` — arbre récursif de groupes (`options`) et de fichiers
2. `telechargements` — dictionnaire plat, avec une console par entrée
3. `fichier` — chemin unique

`normalizeResourceDetail` réduit les trois cas à une structure unique
(`DownloadGroup[]` + `fileCount`), ce qui permet à l’UI de décider simplement : un seul
fichier déclenche le téléchargement directement, plusieurs ouvrent la feuille de sélection.

## Cache et requêtes

TanStack Query gère tout le cache réseau, avec `staleTime` de 2 minutes et `gcTime` de
30 minutes. Les clés sont centralisées dans `services/queryKeys.ts`.

- Une réponse 404 n’est jamais retentée (`ApiError.isNotFound`)
- Les listes de filtres sont considérées fraîches pendant une heure
- Le catalogue utilise `useInfiniteQuery` avec des pages de 24 éléments
- La recherche conserve les résultats précédents pendant la frappe
  (`placeholderData`), et le champ est débouncé à 350 ms

## État persistant

Zustand avec le middleware `persist`, adossé à MMKV via `stores/storage.ts`. Un
fallback `localStorage` / mémoire permet au bundle web de fonctionner, MMKV reposant sur
Nitro/JSI.

| Store | Clé | Contenu |
|---|---|---|
| `settings` | `lbxmb.settings` | Thème, consentement, disposition du catalogue, haptique |
| `favorites` | `lbxmb.favorites` | Instantané des ressources favorites |
| `history` | `lbxmb.history` | 100 derniers téléchargements, 12 dernières recherches |

Les favoris stockent un instantané (titre, plateforme, logo) et non une simple référence :
l’écran reste utilisable hors ligne, comme demandé.

## Téléchargements

`services/download.ts` écrit dans `documents/telechargements/` avec
`File.downloadFileAsync`, en remontant la progression, puis ouvre la feuille de partage
système pour que l’utilisateur choisisse la destination finale.

Les liens externes (releases GitHub, miroirs) sont ouverts dans le navigateur : rien ne
garantit qu’il s’agisse d’une URL de fichier direct.

Chaque téléchargement incrémente le compteur public via
`POST /api/resources/{id}/download`. Cet appel est volontairement silencieux : l’endpoint
est limité en débit et un rejet ne doit pas remonter à l’utilisateur.

## Analytics

`services/analytics.ts` est un client Umami minimal qui n’émet **que** si
`settings.consent === 'full'`. Aucun identifiant n’est transmis : Umami calcule un hachage
anonyme côté serveur. Les vues d’écran passent par `useScreenTracking`, branché sur
`useFocusEffect`.

## Thème

`ui/theme/ThemeProvider.tsx` résout la préférence (`auto` / `light` / `dark`) avec le
schéma système et expose `useTheme()` / `useColors()`. Le défaut est `dark`, conformément
au design et au site. Le changement est instantané : aucune couleur n’est figée dans un
`StyleSheet.create`, seules les valeurs géométriques le sont.

## Performance

- `FlashList` pour le catalogue
- `expo-image` avec `cachePolicy: 'memory-disk'` et transitions courtes
- Images d’upload versionnées par `logoVersion` pour éviter les caches périmés
- Délais d’apparition plafonnés pour que les longues listes ne traînent pas
- Les composants ne se réabonnent qu’aux tranches de store utilisées
