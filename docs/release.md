# Publier une version

Une release se déclenche **uniquement** par un tag. Rien n’est construit sur un
simple push.

```bash
git tag v1.0.1
git push origin v1.0.1
```

Le workflow [`.forgejo/workflows/release.yml`](../.forgejo/workflows/release.yml)
prend le relais et publie l’APK et l’IPA sur
[git.lbxmb.fr/lbxmb/app/releases](https://git.lbxmb.fr/lbxmb/app/releases).

## Numéro de version

Le tag est la seule source de vérité. Le workflow en extrait la version
(`v1.0.1` → `1.0.1`), l’écrit dans `package.json`, et `app.config.ts` en dérive
un numéro de build strictement croissant :

```
1.0.1  →  versionCode / buildNumber 10001
1.2.3  →  versionCode / buildNumber 10203
```

Conséquence : `minor` et `patch` ne peuvent pas dépasser 99. Un tag qui n’est pas
du `vX.Y.Z` fait échouer le workflow immédiatement.

Aucun numéro de version n’est donc à modifier à la main. En local, la version de
`package.json` sert de valeur par défaut.

## Ce que fait le workflow

| Job | Rôle |
|---|---|
| `release` | Valide le tag, génère les notes depuis les commits, crée la release |
| `android` | Installe le SDK et le NDK, `prebuild`, `assembleRelease`, signe, publie l’APK |
| `ios` | Délègue le build à EAS, télécharge l’IPA, la publie |

Les deux jobs de build tournent en parallèle et attachent leurs fichiers
(`lbxmb_1.0.1_android.apk`, `lbxmb_1.0.1_ios.ipa`) accompagnés de leur empreinte
`.sha256`.

## Secrets à configurer

Aucun n’est obligatoire pour que le workflow aboutisse, mais chacun débloque une
partie du pipeline.

| Secret | Effet s’il est absent |
|---|---|
| `RELEASE_TOKEN` | Le token automatique du runner est utilisé à la place |
| `ANDROID_KEYSTORE_BASE64` | L’APK garde sa signature de développement |
| `ANDROID_KEYSTORE_PASSWORD` | idem |
| `ANDROID_KEY_ALIAS` | idem |
| `ANDROID_KEY_PASSWORD` | idem |
| `EXPO_TOKEN` | Le job iOS est ignoré avec un avertissement |

### Générer le keystore Android

À faire **une seule fois** : si la clé est perdue, aucune mise à jour ne peut
plus être publiée sous le même identifiant d’application.

```bash
keytool -genkeypair -v \
  -keystore lbxmb-release.jks \
  -alias lbxmb \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=LB'XMB, O=LB'XMB, C=FR"

base64 -w0 lbxmb-release.jks   # valeur de ANDROID_KEYSTORE_BASE64
```

Garder le fichier `.jks` hors du dépôt, dans un coffre.

### iOS et EAS

Signer une IPA demande macOS. Sans runner Apple, le build passe par
[EAS Build](https://docs.expo.dev/build/introduction/), qui fournit les machines
et conserve les certificats :

```bash
npx eas login
npx eas build:configure
npx eas credentials        # certificat de distribution + profil de provisioning
```

Puis déposer le token (`npx eas whoami --json`, ou un *robot token* depuis
expo.dev) dans le secret `EXPO_TOKEN`. Un compte Apple Developer payant reste
nécessaire pour produire une IPA installable.

## APK ou AAB

L’asset de release est un **APK universel**, pensé pour l’installation directe
depuis le site ou le forum. Le Play Store, lui, exige un bundle :

```bash
npx eas build --platform android --profile production-store
```

Le profil `production-store` produit un `.aab` que Google découpe ensuite par
architecture, ce qui divise à peu près par deux ce que télécharge l’utilisateur.

## Avant une première soumission

Le pipeline couvre la fabrication des binaires, pas la conformité des fiches
store. Restent à préparer :

- une politique de confidentialité atteignable publiquement — l’app pointe déjà
  vers [`/legal/rgpd`](https://lbxmb.fr/legal/rgpd), à compléter d’une section
  propre à l’application (aucun compte, statistiques optionnelles, favoris
  stockés localement) ;
- le questionnaire **Data safety** (Google) et les **privacy labels** (Apple) :
  aucune donnée collectée si l’utilisateur refuse, sinon des statistiques
  d’usage anonymes non liées à son identité ;
- des captures d’écran par format d’appareil, plus le
  [`design/store/feature-graphic.png`](../design/store/feature-graphic.png) pour
  Google Play ;
- une adresse de contact support ;
- un test sur appareil réel iOS et Android.

Point de vigilance : le sujet du modding console est examiné de près, surtout par
Apple. La fiche doit décrire un **catalogue communautaire de ressources et de
guides techniques**, rappeler l’absence d’affiliation avec Sony, Microsoft et
Nintendo, et éviter tout vocabulaire évoquant le contournement de protections.
