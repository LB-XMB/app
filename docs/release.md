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

Côté Forgejo, trois jobs s’enchaînent : `release` valide le tag, génère les notes
depuis les commits et crée la release ; `android` installe le SDK et le NDK,
lance `prebuild` puis `assembleRelease`, signe et attache l’APK ; `ios` récupère
l’IPA et l’attache à son tour.

Ce dernier job ne compile rien : il télécharge le fichier depuis la **release
GitHub** du même tag, où le runner macOS l’a déposé. Le transfert va donc de
GitHub vers Forgejo, à l’initiative du runner local — jamais l’inverse. C’est
volontaire : une requête sortante du runner GitHub vers `git.lbxmb.fr` ajoute un
point de défaillance dont les journaux ne sont lisibles que par un administrateur
du dépôt GitHub.

Comme `ios` attend la fin de `android`, le build macOS dispose déjà du quart
d’heure qu’il lui faut quand son tour arrive. S’il n’a toujours rien publié, le
job réessaie pendant vingt minutes avant d’abandonner.

Chaque binaire arrive accompagné de son empreinte `.sha256`, vérifiée au passage
pour l’IPA : `lbxmb_1.0.1_android.apk` et `lbxmb_1.0.1_ios-unsigned.ipa`.

## Secrets à configurer

| Secret | Effet s’il est absent |
|---|---|
| `RELEASE_TOKEN` | **Le pipeline s’arrête immédiatement** |
| `ANDROID_KEYSTORE_BASE64` | L’APK garde sa signature de développement |
| `ANDROID_KEYSTORE_PASSWORD` | idem |
| `ANDROID_KEY_ALIAS` | idem |
| `ANDROID_KEY_PASSWORD` | idem |

### Le token de release

C’est le seul secret obligatoire, et il détermine **qui apparaît comme auteur de
la release**. Le `GITHUB_TOKEN` que le runner fournit tout seul n’est rattaché à
aucun compte : une release créée avec lui s’affiche signée `Ghost`. Il faut donc
un jeton d’accès personnel.

1. Aller sur <https://git.lbxmb.fr/user/settings/applications>, connecté avec le
   compte qui doit signer les releases (`interverti`).
2. Générer un jeton avec le seul périmètre `write:repository`.
3. L’ajouter dans `Settings → Actions → Secrets` du dépôt, sous le nom exact
   `RELEASE_TOKEN`.

Le workflow vérifie le jeton avant toute autre chose et affiche le compte
retenu (`Releases will be authored by …`), ce qui évite de découvrir le problème
une fois la release publiée. Une release déjà signée `Ghost` ne peut pas être
réattribuée après coup : l’auteur est figé à la création.

Côté GitHub, **aucun secret n’est nécessaire** : le workflow iOS se contente du
`GITHUB_TOKEN` fourni automatiquement à chaque exécution pour publier l’IPA sur
sa propre release.

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

1. Créer le dépôt [`LB-XMB/app`](https://github.com/LB-XMB/app) sur GitHub, en
   **public** : les minutes macOS y sont gratuites, alors qu’un dépôt privé n’en
   offre que 200 par mois sur le plan Free, soit environ un build.
2. Dans Forgejo, **Paramètres → Miroirs → Ajouter un miroir push** vers
   `https://github.com/LB-XMB/app.git`, avec un *personal access token* GitHub
   (portée `repo`) comme mot de passe, et la synchronisation des nouveaux commits
   activée.

C’est tout : le miroir pousse commits et tags, le tag déclenche le build macOS,
et le job `ios` de Forgejo vient chercher le résultat. Le dépôt GitHub reste un
sous-traitant de compilation ; ne jamais y committer directement, le miroir push
écrase les références distantes.

Le workflow est aussi déclenchable à la main (`workflow_dispatch`) en saisissant
un numéro de version. Dans ce mode, l’IPA reste un simple artefact de run : rien
n’est publié, ce qui en fait un bon test à blanc.

Si le nom du dépôt miroir change, il apparaît à un seul endroit, la variable
`MIRROR` du job `ios`.

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
