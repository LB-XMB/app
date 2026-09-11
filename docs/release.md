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

Le même tag déclenche deux pipelines, sur deux forges différentes.

| Workflow | Forge | Rôle |
|---|---|---|
| `.forgejo/workflows/release.yml` | Forgejo | Crée la release, construit et publie l’APK |
| `.github/workflows/ios.yml` | GitHub | Construit l’IPA sur un runner macOS et la publie |

Le premier enchaîne deux jobs : `release` valide le tag, génère les notes depuis
les commits et crée la release ; `android` installe le SDK et le NDK, lance
`prebuild` puis `assembleRelease`, signe et attache le fichier.

Chaque binaire arrive accompagné de son empreinte `.sha256` :
`lbxmb_1.0.1_android.apk` et `lbxmb_1.0.1_ios-unsigned.ipa`.

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

Et côté GitHub, pour le workflow iOS :

| Secret | Effet s’il est absent |
|---|---|
| `FORGEJO_TOKEN` | L’IPA reste un artefact GitHub au lieu d’être attachée à la release |

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

## iOS : le miroir GitHub

Compiler pour iOS exige Xcode, donc macOS. Forgejo n’a pas de runner Apple, et
un IPA signé demanderait un abonnement Apple Developer. Le build part donc sur
les runners macOS de GitHub, gratuits, et produit un **IPA non signé** : le
format que la communauté installe avec AltStore, SideStore, TrollStore ou
Sideloadly, qui le resignent avec le compte Apple de l’utilisateur.

### Mise en place, une seule fois

1. Créer le dépôt `app` sur GitHub, vide.
2. Dans Forgejo, **Paramètres → Dépôt → Miroirs → Ajouter un miroir push** vers
   `https://github.com/<compte>/app.git`, avec un *personal access token* GitHub
   (portée `repo`) comme mot de passe, et l’option de synchronisation des tags
   activée.
3. Générer un token Forgejo (portée `write:repository`) et le déposer dans les
   secrets du dépôt GitHub sous le nom `FORGEJO_TOKEN`.

Le miroir pousse les commits et les tags ; le tag déclenche le workflow iOS, qui
renvoie l’IPA vers la release Forgejo. Les deux pipelines tournant en parallèle,
le job iOS attend jusqu’à dix minutes que la release apparaisse avant d’abandonner.

Le workflow est aussi déclenchable à la main (`workflow_dispatch`) en saisissant
un numéro de version, ce qui est pratique pour tester sans créer de tag.

### Passer à un IPA signé

Le jour où un compte Apple Developer entre en jeu, les profils EAS de
`eas.json` sont déjà prêts et fournissent, eux, un binaire acceptable par
TestFlight et l’App Store :

```bash
npx eas login
npx eas credentials        # certificat de distribution + profil de provisioning
npx eas build --platform ios --profile production
```

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
