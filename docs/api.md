# API lbxmb.fr

Base : `https://lbxmb.fr` · Documentation interactive : <https://lbxmb.fr/api> ·
Spécification : <https://lbxmb.fr/openapi.json>

L’API est publique et sans authentification. Cloudflare protège contre les abus massifs,
mais il n’y a pas de quota en usage normal.

## Endpoints utilisés

| Méthode | Chemin | Fonction du client |
|---|---|---|
| `GET` | `/api/home` | `fetchHome()` |
| `GET` | `/api/stats` | `fetchCommunityStats()` |
| `GET` | `/api/stats/home` | `fetchHomeStats()` |
| `GET` | `/api/resources` | `fetchResources()` |
| `GET` | `/api/resources/{id}` | `fetchResource()` |
| `GET` | `/api/resources/filters` | `fetchResourceFilters()` |
| `POST` | `/api/resources/{id}/download` | `trackResourceDownload()` |
| `GET` | `/api/guides` | `fetchGuides()` |
| `GET` | `/api/guides/{id}` | `fetchGuide()` |
| `GET` | `/api/site-search?q=` | `searchSite()` |
| `GET` | `/api/uploads/{chemin}` | `uploadUrl()` — médias et fichiers |

## Paramètres du catalogue

`GET /api/resources` accepte `page`, `limit` (max 100), `search`, `platform`, `category`,
`subcategory`, `jeu` et `sort` (`recent` ou `popular`). Le client envoie des pages de 24.

`platform` attend le libellé exact renvoyé par `/api/resources/filters`, par exemple
`PS4` ou `Nintendo Switch`.

## Pièges rencontrés

Ces particularités sont toutes absorbées par `services/api/normalize.ts`.

**Nombres transmis en chaînes.** `pagination.total` vaut `"264"`, et `/api/stats` renvoie
`{"count":"233","threads":"125"}`. Tout passe par `toNumber()`.

**JSON encodé dans une chaîne.** Sur le détail d’une ressource, `variantes`, `releases`,
`tags`, `media_rendu` et `reseaux_sociaux` sont des chaînes contenant du JSON. Elles sont
parsées de façon défensive : une chaîne invalide donne une valeur vide, pas une exception.

**Noms de champs différents entre liste et détail.**

| Liste | Détail |
|---|---|
| `id` | `resource_id` |
| `title` | `nom` |
| `category` | `categorie` |
| `platform` | `console` |
| `downloads` | `nb_telechargements` |
| `author` | `auteur_name` |

**Chemins d’upload non encodés.** Les valeurs de `logo` ou `chemin` contiennent des espaces
et des accents (`ressources/Webman Mod/Icon.png`). Chaque segment doit être encodé
séparément avant d’être préfixé par `/api/uploads/`, sinon le média renvoie 404.

**Invalidation de cache.** Les images d’upload sont servies avec un cache long. Le
paramètre `?v=` reçoit `logoVersion` (ou l’horodatage de `date_modification`) pour forcer
le rafraîchissement après une mise à jour.

**Trois formats de téléchargement.** Voir la section correspondante dans
[`architecture.md`](./architecture.md).

**Contenu des guides.** `/api/guides/{id}` renvoie un document
[TipTap](https://tiptap.dev) découpé en chapitres. Il est rendu nativement par
`components/guides/RichText.tsx`, qui gère les paragraphes, titres, listes, citations,
blocs de code, images, liens et les marques `textStyle` (couleur et taille). Un type de
nœud inconnu affiche ses enfants plutôt que de disparaître.

**Compteur de téléchargements.** `POST /api/resources/{id}/download` est limité en débit
et n’incrémente qu’une fois par utilisateur ou IP sur 30 jours. L’appel est émis sans
attendre son résultat.

**Recherche globale.** `/api/site-search` exige au moins deux caractères et renvoie des
résultats hétérogènes (`resource`, `guide`, `forum_thread`, `shop`, `profile`). Les
ressources et les guides ouvrent un écran natif ; les autres types ouvrent le site dans le
navigateur, faute d’équivalent dans l’application.

## CORS

L’API ne renvoie pas d’en-tête `Access-Control-Allow-Origin`. Ce n’est pas un problème sur
iOS et Android, où les requêtes ne sont pas soumises à la politique d’origine. En
revanche, le bundle web (`npm run web`) ne peut pas joindre l’API sans proxy : il sert
uniquement à inspecter la mise en page.
