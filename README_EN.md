<p align="center">
  <img src="./assets/images/logo.png" alt="LB'XMB" width="96">
</p>

<h1 align="center">LB’XMB — Mobile app</h1>

<p align="center">
  <a href="https://git.lbxmb.fr/lbxmb/app/src/branch/main/README.md">Français</a> · English
</p>

<p align="center">
  <img src="./docs/previews/feature.png" alt="LB’XMB — banner" width="720">
</p>

<p align="center">
  The community console-modding catalogue, in your pocket.<br>
  Browse resources and guides for PlayStation, Xbox, Nintendo and PC,
  download files, push a PKG over FTP, and keep favourites offline.
</p>

<p align="center">
  <a href="https://lbxmb.fr"><img src="https://img.shields.io/badge/site-lbxmb.fr-3B82F6?style=flat-square" alt="Website"></a>
  <a href="https://lbxmb.fr/api"><img src="https://img.shields.io/badge/API-public-F97316?style=flat-square" alt="API"></a>
  <a href="https://expo.dev"><img src="https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo" alt="Expo"></a>
  <a href="https://git.lbxmb.fr/lbxmb/app/releases"><img src="https://img.shields.io/badge/release-Forgejo-f97316?style=flat-square" alt="Releases"></a>
</p>

<p align="center">
  <img src="./docs/previews/01-accueil.png" alt="Home" width="180">
  &nbsp;
  <img src="./docs/previews/02-catalogue.png" alt="Catalogue" width="180">
  &nbsp;
  <img src="./docs/previews/06-ressource.png" alt="Resource detail" width="180">
  &nbsp;
  <img src="./docs/previews/03-ftp.png" alt="FTP" width="180">
</p>

<p align="center">
  <img src="./docs/previews/07-connexion.png" alt="Sign in" width="180">
  &nbsp;
  <img src="./docs/previews/05-profil.png" alt="Profile" width="180">
  &nbsp;
  <img src="./docs/previews/08-guides.png" alt="Guides" width="180">
  &nbsp;
  <img src="./docs/previews/04-recherche.png" alt="Search" width="180">
</p>

---

## Install

| Platform | How |
|---|---|
| **Android — Obtainium** | Install [Obtainium](https://github.com/ImranR98/Obtainium/releases), then open the badge below. Open the Obtainium badge (**HTML** source → [`/releases`](https://git.lbxmb.fr/lbxmb/app/releases) page). |
| **Android — F-Droid** | Not in the official catalogue yet (see [`store/fdroid.md`](./store/fdroid.md)). Obtainium covers the same need. |
| **iOS — SideStore** | Sources → add<br>`https://git.lbxmb.fr/lbxmb/app/raw/branch/main/store/sidestore.json`<br>Unsigned IPA (SideStore / AltStore / TrollStore). |
| **Manual** | APK / IPA on the [releases page](https://git.lbxmb.fr/lbxmb/app/releases). |

<p align="center">
  <a href="https://apps.obtainium.imranr.dev/redirect?r=obtainium://app/%7B%22id%22%3A%22fr.lbxmb.app%22%2C%22url%22%3A%22https%3A%2F%2Fgit.lbxmb.fr%2Flbxmb%2Fapp%2Freleases%22%2C%22author%22%3A%22LB%27XMB%22%2C%22name%22%3A%22LB%27XMB%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22overrideSource%5C%22%3A%5C%22HTML%5C%22%2C%5C%22customLinkFilterRegex%5C%22%3A%5C%22android.apk%24%5C%22%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22android.apk%24%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Afalse%2C%5C%22sortByLastLinkSegment%5C%22%3Atrue%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%28%5B0-9%5D%2B%5C%5C%5C%5C.%5B0-9%5D%2B%5C%5C%5C%5C.%5B0-9%5D%2B%29%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%221%5C%22%2C%5C%22about%5C%22%3A%5C%22Catalogue%20communautaire%20de%20modding%20console%20%28source%20HTML%20Forgejo%29.%5C%22%7D%22%7D"><img src="https://img.shields.io/badge/Get_on-Obtainium-2E7D32?style=for-the-badge&logo=android&logoColor=white" alt="Obtainium" /></a>
  &nbsp;
  <a href="sidestore://source?url=https%3A%2F%2Fgit.lbxmb.fr%2Flbxmb%2Fapp%2Fraw%2Fbranch%2Fmain%2Fstore%2Fsidestore.json"><img src="https://img.shields.io/badge/Add_in-SideStore-5C6BC0?style=for-the-badge&logo=apple&logoColor=white" alt="SideStore" /></a>
  &nbsp;
  <a href="https://git.lbxmb.fr/lbxmb/app/releases"><img src="https://img.shields.io/badge/APK%20%2F%20IPA-Releases-3B82F6?style=for-the-badge" alt="Releases" /></a>
</p>

Configs: [`store/obtainium.json`](./store/obtainium.json), [`store/sidestore.json`](./store/sidestore.json).

> **Obtainium**: delete the old entry, then re-import the badge. Config uses the **HTML** source on `…/releases` (more reliable than the Forgejo API in Obtainium). File: [`store/obtainium.json`](./store/obtainium.json).

## Features

| | |
|---|---|
| **Home** | Community stats, popular resources, news and guides |
| **Catalogue** | Filter by console / category, grid or list |
| **Resource page** | Description, gallery, in-app video (Plyr / native), downloads |
| **FTP** | Send a PKG to your console (same Wi-Fi, FTP server running) |
| **Search** | Resources, guides, forum, profiles |
| **Guides** | Native-rendered tutorials |
| **Profile** | lbxmb.fr account, favourites, history, privacy |

## Privacy

On first launch: anonymous usage stats (Umami) or nothing. Change anytime under **Profile → Settings → Privacy**.

## Development

### Requirements

- Node.js 20+
- iOS simulator / Android emulator / device
- **Development build** (native modules: MMKV, Reanimated, TCP, video)

### Start

```bash
npm install
npm run prebuild
npm run android   # or npm run ios
```

Then `npm start` is enough for day-to-day work.

### Scripts

| Command | Role |
|---|---|
| `npm start` | Metro |
| `npm run android` / `ios` | Build + install |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run prebuild` | Native projects |
| `npm run doctor` | Dependency check |

### Release

```bash
git tag v1.0.4 && git push origin v1.0.4
```

Details: [`docs/release.md`](./docs/release.md).

### Layout

```
app/                 Routes (Expo Router)
├── (tabs)/          Home, Catalogue, FTP, Search, Profile
├── ressource/[id]   Resource detail
├── guides/          Guides
└── bienvenue.tsx    Consent screen

ui/                  Design system
components/          Feature UI (resources, auth, forum, layout)
services/            API, downloads, FTP, analytics
stores/              Zustand + MMKV
```

See [`docs/architecture.md`](./docs/architecture.md), [`docs/api.md`](./docs/api.md), [`design/README.md`](./design/README.md).

### Stack

Expo SDK 57 · React Native 0.86 · Expo Router · TanStack Query · Zustand + MMKV · Reanimated 4 · expo-video + Plyr (YouTube) · Syne / Inter · Lucide

## Contributing

1. `npm run typecheck && npm run lint`
2. Use `ui/theme` (no hard-coded colours / spacing)
3. Cover loading / error / empty states

Source: [git.lbxmb.fr/lbxmb/app](https://git.lbxmb.fr/lbxmb/app).

## Credits

UI inspired by [Papillon](https://github.com/PapillonApp/Papillon).

<div align="center">
<sub>Made with ❤️ by the <a href="https://lbxmb.fr">LB’XMB</a> community</sub>
</div>
