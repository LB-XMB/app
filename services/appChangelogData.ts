/** Keep in sync with `docs/app-changelog.md`. */
export const APP_CHANGELOG_MD = `## 1.0.18

- PKG GoldHEN : attendre 100 % + grace 60 s avant revoke (fini les 404 / « Téléchargement impossible » à ~98 %)
- Reopen SAF si Bad file descriptor ; logs HTTP moins verbeux

## 1.0.17

- Correctif HTTP : attendre le drain socket avant close (manifeste JSON plus tronqué → BGFT démarre le download PKG)
- Logs debug : accept TCP, taille manifeste, self-HEAD /pkg/pkg

## 1.0.16

- PKG debug temporaire : panneau de logs live (LAN, mode, URL, HTTP Range, progression, erreurs GoldHEN/BGFT)
- Champ IP LAN manuelle + attente download console jusqu’à ~98 % / stall 120s / 6h (évite revoke HTTP prématuré)

## 1.0.15

- GoldHEN / BGFT : digest PKG + CONTENT_ID dans le manifeste (corrige DPI BGFT Error)
- Plus de copie multi‑Go dans le dcache ; purge DocumentPicker / staging au démarrage
- FTP : tri type FileZilla (dossiers d’abord) + toggle
- Navbar : icônes seules (sans labels)

## 1.0.14

- Envoi PKG multi‑Go : plus de copie cache à la sélection, lecture HTTP par morceaux (évite écran noir / OOM)
- FTP : matérialise \`content://\` en chemin local via copie native streamée

## 1.0.13

- Correctif connexion Discord / « Continuer sur le site » (\`dismissBrowser\` sans \`.catch\` sur undefined)
- Téléchargements : explorateur Android / Fichiers iOS, dossier par défaut dans Paramètres, choix au premier DL
- Sélection de fichiers native (DocumentPicker) pour FTP et envoi PKG

## 1.0.12

- FTP natif via \`@anttech/react-native-ftp\` (SFTP retiré)
- Envoi PKG PS4/PS5 en LAN (protocole [PKG Sender](https://github.com/Loopayeh/pkg-sender) / Loopayeh, MIT)
- Onglet PKG : détection UDP, test console, file d’install, images homebrew

## 1.0.11

- Widgets Android : Stats communauté et Populaires (sélecteur d’écran d’accueil)
- Refresh depuis l’écran Widgets / ouverture de l’app

## 1.0.10

- Correctif CI SideStore (checkout avant push du source JSON)
- Queues DL/FTP : reprise après kill (plus de jobs \`running\` fantômes)
- Accueil kawaii : sous-titre « Ressources et guides… » à droite du logo
- Docs architecture / QA auth / Cloudflare ; tests Vitest normalize + queues

## 1.0.9

- Toggle logo kawaii (accueil + splash au démarrage)
- Alignement des chiffres sur la grille de stats Accueil

## 1.0.8

- File d’attente des téléchargements avec progression et retry
- Notifications locales optionnelles quand un fichier est prêt
- Partage de fiche ressource (URL lbxmb.fr)
- Filtres catalogue mémorisés
- Profils FTP multiples + file d’envoi ; mots de passe dans le coffre appareil
- Changelog in-app après mise à jour
- Deep links \`lbxmb://\` et App Links lbxmb.fr
- Listes locales, signalement, inbox forum, profils publics
- Cache hors-ligne des fiches / guides, verrouillage biométrique, i18n EN
- Préparation widgets (aperçu données) ; passkeys restent via le site
- Correctif build Android (polyfills Metro / stub SFTP)

## 1.0.7

- Connexion Android : attend le retour du navigateur avant d’abandonner le poll
- Release GitHub iOS publiée (plus de draft silencieux)

## 1.0.6

- Login QR via navigateur système et headers Origin / User-Agent app
`;
