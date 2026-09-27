# Google Play + EAS cloud (Android)

Cible **uniquement Google Play** pour l’instant. Le sideload Forgejo / Obtainium
(APK arm64 via `.forgejo/workflows/release.yml`) reste inchangé.

| Canal | Artefact | Profil / pipeline |
|---|---|---|
| Sideload | `.apk` arm64-v8a | Forgejo `release.yml` → `assembleRelease` |
| Play Store | `.aab` | EAS profil `production-store` |

Package : **`fr.lbxmb.app`**. Privacy : <https://lbxmb.fr/legal/rgpd>.

## Prérequis

```bash
npm i -g eas-cli   # ou npx eas-cli@latest
eas login
eas whoami
cd /path/to/lbxmb/app
```

Compte Expo (expo.dev) rattaché à l’orga / user qui publie. Pour le CI non
interactif : variable d’environnement `EXPO_TOKEN` (expo.dev → Access tokens).

## Lier le projet EAS

Si `extra.eas.projectId` est absent de `app.config.ts` :

```bash
eas init
# ou
eas build:configure
```

Cela écrit un `projectId` UUID dans `app.config.ts` (à committer). Override
ponctuel : `EAS_PROJECT_ID=<uuid>`.

## Credentials Android (keystore)

**Préférer réutiliser le keystore de la CI sideload** (`ANDROID_KEYSTORE_*` sur
Forgejo) pour ne pas fragmenter les signatures sous le même `applicationId`.

```bash
eas credentials
# Android → production / production-store → Set up a new keystore
# → Upload an existing keystore  (le .jks déjà utilisé pour les APK Forgejo)
```

Sinon générer via EAS et **archiver le `.jks` hors git** (coffre). Une perte de
clé empêche toute mise à jour Play sous `fr.lbxmb.app`.

| Secret Forgejo (sideload) | Usage EAS |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Décoder → upload dans `eas credentials` |
| `ANDROID_KEYSTORE_PASSWORD` | Mot de passe keystore |
| `ANDROID_KEY_ALIAS` | Alias (souvent `lbxmb`) |
| `ANDROID_KEY_PASSWORD` | Mot de passe clé |

Voir aussi [release.md](./release.md) § Générer le keystore.

## Build AAB cloud

```bash
eas build --platform android --profile production-store --non-interactive
```

- Profil : [`eas.json`](../eas.json) → `production-store` (`buildType: app-bundle`)
- Version / `versionCode` : lus depuis `package.json` / tag (`app.config.ts` →
  `1.0.20` → `versionCode` `10020`)
- Sortie : lien expo.dev + artefact `.aab` téléchargeable

Suivi :

```bash
eas build:list --platform android --limit 5
eas build:view
```

## Submit Play

### Option A — EAS Submit

Configurer le service account Google Play (JSON) une fois :

```bash
eas submit --platform android --profile production-store --latest
```

Le profil `production-store` soumet en piste **internal** / statut **draft**
(ajustable dans `eas.json` → `submit.production-store`).

Variables utiles : `EXPO_TOKEN`, et credentials Play via
`eas credentials` / fichier service account.

### Option B — Upload manuel

1. Télécharger l’AAB depuis la page du build expo.dev
2. Play Console → LB’XMB → Production (ou test interne) → Créer une version
3. Uploader le `.aab`

## Cleartext LAN

`expo-build-properties` active `usesCleartextTraffic` pour le **FTP** et le
serveur HTTP Range **PKG** vers une console sur le Wi‑Fi local. Le trafic
lbxmb.fr reste en HTTPS. Ne pas élargir (pas de proxy HTTP arbitraire).

## Checklist avant première soumission

Voir [play-store-listing.md](./play-store-listing.md) (textes + Data safety) et :

- [ ] `eas whoami` OK + `projectId` commité
- [ ] Keystore aligné CI / EAS
- [ ] AAB `production-store` vert
- [ ] Privacy URL publique
- [ ] Data safety rempli
- [ ] Captures + feature graphic (`design/store/feature-graphic.png` 1024×500)
- [ ] Fiche : catalogue / guides — **pas** de promesse piratage / DRM bypass
- [ ] Disclaimer non affilié Sony / Microsoft / Nintendo
