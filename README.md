<div align="center">

<img src="./assets/images/logo.png" alt="LB'XMB" width="140" />

# LB’XMB — Application mobile

**Le catalogue communautaire de modding console, dans ta poche.**

Parcours des centaines de ressources et de guides pour PlayStation, Xbox, Nintendo et PC,
télécharge tes fichiers et garde tes favoris à portée de main, même hors ligne.

[![Site web](https://img.shields.io/badge/site-lbxmb.fr-3B82F6?style=for-the-badge)](https://lbxmb.fr)
[![API](https://img.shields.io/badge/API-publique-F97316?style=for-the-badge)](https://lbxmb.fr/api)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo)](https://expo.dev)

</div>

---

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
design/              Exports du design
docs/                Documentation technique
```

Le détail est documenté dans [`docs/architecture.md`](./docs/architecture.md), l’API dans
[`docs/api.md`](./docs/api.md) et le design system dans
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
