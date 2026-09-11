<div align="center">

<img src="./assets/images/logo.png" alt="LB'XMB" width="140" />

# LB’XMB — Application mobile

**Le catalogue communautaire de modding console, dans ta poche.**

Parcours des centaines de ressources et de guides pour PlayStation, Xbox, Nintendo et PC,
télécharge tes fichiers et garde tes favoris à portée de main, même hors ligne.

[![Site web](https://img.shields.io/badge/site-lbxmb.fr-3B82F6?style=for-the-badge)](https://lbxmb.fr)
[![API](https://img.shields.io/badge/API-publique-F97316?style=for-the-badge)](https://lbxmb.fr/api)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![Obtainium](https://img.shields.io/badge/Obtainium-Android-2E7D32?style=for-the-badge)](https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22fr.lbxmb.app%22%2C%22url%22%3A%22https%3A%2F%2Fgit.lbxmb.fr%2Flbxmb%2Fapp%22%2C%22author%22%3A%22LB%27XMB%22%2C%22name%22%3A%22LB%27XMB%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22overrideSource%5C%22%3A%5C%22Forgejo%20(Codeberg)%5C%22%2C%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22android%5C%5C%5C%5C.apk%24%5C%22%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%7D%22%7D)
[![SideStore](https://img.shields.io/badge/SideStore-iOS-5C6BC0?style=for-the-badge)](sidestore://source?url=https%3A%2F%2Fgit.lbxmb.fr%2Flbxmb%2Fapp%2Fraw%2Fbranch%2Fmain%2Fstore%2Fsidestore.json)
[![F-Droid](https://img.shields.io/badge/F--Droid-via%20Obtainium-1976D2?style=for-the-badge&logo=f-droid&logoColor=white)](https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22fr.lbxmb.app%22%2C%22url%22%3A%22https%3A%2F%2Fgit.lbxmb.fr%2Flbxmb%2Fapp%22%2C%22author%22%3A%22LB%27XMB%22%2C%22name%22%3A%22LB%27XMB%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22overrideSource%5C%22%3A%5C%22Forgejo%20(Codeberg)%5C%22%2C%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22android%5C%5C%5C%5C.apk%24%5C%22%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%7D%22%7D)

</div>

---

## Installation

| Plateforme | Comment faire |
|---|---|
| **Android — Obtainium** | Installe [Obtainium](https://github.com/ImranR98/Obtainium/releases), puis ouvre le badge ci-dessus (ou ajoute `https://git.lbxmb.fr/lbxmb/app` avec la source *Forgejo (Codeberg)*). Les mises à jour APK arrivent à chaque tag. |
| **Android — F-Droid** | Pas encore dans le catalogue officiel (voir [`store/fdroid.md`](./store/fdroid.md)). En attendant, **Obtainium** joue le même rôle : APK signé depuis nos releases, hors Play Store. |
| **iOS — SideStore** | Dans SideStore → Sources → ajoute<br>`https://git.lbxmb.fr/lbxmb/app/raw/branch/main/store/sidestore.json`<br>L’IPA n’est pas signée : SideStore / AltStore / TrollStore s’occupent de la signature. |
| **Manuel** | Télécharge l’APK ou l’IPA sur la [page des releases](https://git.lbxmb.fr/lbxmb/app/releases). |

<p align="center">
  <a href="https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22fr.lbxmb.app%22%2C%22url%22%3A%22https%3A%2F%2Fgit.lbxmb.fr%2Flbxmb%2Fapp%22%2C%22author%22%3A%22LB%27XMB%22%2C%22name%22%3A%22LB%27XMB%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22overrideSource%5C%22%3A%5C%22Forgejo%20(Codeberg)%5C%22%2C%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22android%5C%5C%5C%5C.apk%24%5C%22%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%7D%22%7D"><img src="https://img.shields.io/badge/Obtenir_sur-Obtainium-2E7D32?style=for-the-badge&logo=android&logoColor=white" alt="Obtainium" /></a>
  &nbsp;
  <a href="sidestore://source?url=https%3A%2F%2Fgit.lbxmb.fr%2Flbxmb%2Fapp%2Fraw%2Fbranch%2Fmain%2Fstore%2Fsidestore.json"><img src="https://img.shields.io/badge/Ajouter_dans-SideStore-5C6BC0?style=for-the-badge&logo=apple&logoColor=white" alt="SideStore" /></a>
  &nbsp;
  <a href="https://git.lbxmb.fr/lbxmb/app/releases"><img src="https://img.shields.io/badge/APK%20%2F%20IPA-Releases-3B82F6?style=for-the-badge" alt="Releases" /></a>
</p>

Les configs brutes sont dans [`store/obtainium.json`](./store/obtainium.json) et
[`store/sidestore.json`](./store/sidestore.json).

## Ce que fait l’application

| | |
|---|---|
| **Accueil** | Statistiques de la communauté, ressources populaires, nouveautés et derniers guides |
| **Catalogue** | 260+ ressources filtrables par console, catégorie et tri, en grille ou en liste |
| **Fiche ressource** | Description, captures, changelog, variantes de téléchargement, liens source |
| **Recherche** | Recherche globale sur tout le site : ressources, guides, forum, profils |
| **Guides** | Tutoriels pas à pas, rendus nativement (pas de WebView) |
| **Ma bibliothèque** | Favoris et historique de téléchargements, stockés localement |

L’interface est sombre par défaut, avec un thème clair disponible dans les réglages.

## Confidentialité

Au premier lancement, l’application demande une seule chose : est-ce que tu acceptes de
partager des statistiques d’usage anonymes ? Le choix est respecté à la lettre.

- **Rien du tout** — aucune requête analytique n’est émise, jamais.
- **Je veux aider** — des vues d’écran anonymes partent vers une instance
  [Umami](https://umami.is) auto-hébergée, sans identifiant ni lien avec ton compte lbxmb.fr.

Le réglage est modifiable à tout moment depuis **Profil → Paramètres → Confidentialité**.

## Développement

### Prérequis

- Node.js 20 ou plus
- Un simulateur iOS (Xcode) ou un émulateur Android, ou un appareil physique
- Un **development build** : l’application utilise des modules natifs (MMKV, Reanimated 4)
  qui ne fonctionnent pas dans Expo Go

### Démarrer

```bash
npm install
npm run prebuild          # génère les dossiers android/ et ios/
npm run android           # ou npm run ios
```

Pour les itérations suivantes, `npm start` suffit une fois le build natif installé.

### Scripts

| Commande | Rôle |
|---|---|
| `npm start` | Serveur de développement Metro |
| `npm run android` / `ios` | Compile et installe le development build |
| `npm run typecheck` | Vérification TypeScript stricte |
| `npm run lint` | ESLint (config Expo) |
| `npm run prebuild` | Régénère les projets natifs |
| `npm run doctor` | Diagnostic des versions de dépendances |

### Publier une version

Pousser un tag suffit : Forgejo crée la release et construit l’APK, tandis que
le miroir GitHub fournit le runner macOS qui produit l’IPA.

```bash
git tag v1.0.1 && git push origin v1.0.1
```

Le détail du pipeline et des secrets est dans
[`docs/release.md`](./docs/release.md).

### Architecture

```
app/                 Routes (Expo Router, file-based)
├── (tabs)/          Accueil, Catalogue, Recherche, Profil
├── ressource/[id]   Fiche d’une ressource
├── guides/          Liste et détail des guides
└── bienvenue.tsx    Écran de consentement du premier lancement

ui/                  Design system (thème + primitives réutilisables)
components/          Composants métier (ressources, guides, recherche, layout)
services/            Client API typé, téléchargements, analytics
stores/              État persistant (Zustand + MMKV)
hooks/               Hooks de données (TanStack Query)
design/              Exports du design et assets store
docs/                Documentation technique
```

Le détail est documenté dans [`docs/architecture.md`](./docs/architecture.md), l’API dans
[`docs/api.md`](./docs/api.md), la publication dans
[`docs/release.md`](./docs/release.md) et le design system dans
[`design/README.md`](./design/README.md).

### Stack

- **Expo SDK 57** + **React Native 0.86** (New Architecture)
- **Expo Router** pour la navigation file-based
- **TanStack Query** pour le cache réseau
- **Zustand** + **MMKV** pour l’état persistant
- **Reanimated 4** + **Gesture Handler** pour les animations
- **Syne** et **Inter** (Google Fonts), icônes **Lucide**

Aucune bibliothèque de style externe : le design system maison s’appuie sur
`StyleSheet` et un thème typé.

## Contribuer

Les contributions sont bienvenues. Avant d’ouvrir une pull request :

1. `npm run typecheck && npm run lint` doivent passer sans erreur
2. Respecter le design system : pas de couleur ou d’espacement en dur, tout passe par
   `ui/theme`
3. Prévoir les états de chargement, d’erreur et vides pour tout nouvel écran

Le code source est hébergé sur [git.lbxmb.fr](https://git.lbxmb.fr/lbxmb/app).

## Crédits

Interface inspirée de [Papillon](https://github.com/PapillonApp/Papillon), l’application
scolaire libre et open source, dont le soin apporté à l’expérience mobile a servi de
référence.

<div align="center">
<sub>Fait avec ❤️ par la communauté <a href="https://lbxmb.fr">LB’XMB</a></sub>
</div>
