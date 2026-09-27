# Fiche Google Play — LB’XMB

Textes prêts à coller dans la Play Console. Ton : **catalogue communautaire** et
**guides techniques** — jamais piratage, bypass DRM, ou jailbreak commercial.

Privacy policy : <https://lbxmb.fr/legal/rgpd>  
Support : utiliser l’adresse / formulaire déjà publiés sur lbxmb.fr (forum ou contact légal).  
Package : `fr.lbxmb.app`

## Titre (30 car. max)

```
LB’XMB
```

## Description courte (80 car. max)

```
Catalogue communautaire : ressources et guides techniques console & PC.
```

## Description longue

```
LB’XMB est l’application mobile du catalogue communautaire lbxmb.fr :
ressources, guides techniques et discussions autour des consoles et du PC
(homebrew et projets open-source documentés par la communauté).

Fonctionnalités
• Parcourir ressources et guides, avec recherche et favoris
• Compte lbxmb.fr (connexion optionnelle) pour synchroniser favoris / profil
• Téléchargements vers le stockage de l’appareil (dossier au choix)
• Transfert local sur le réseau Wi‑Fi : FTP et envoi de paquets (PKG) vers une
  console déjà configurée chez toi — aucun service de distribution de copies
  illégales
• Widgets Android (stats communauté, populaires)
• Thème clair / sombre, verrouillage biométrique optionnel

Important
• LB’XMB n’est pas affilié à Sony Interactive Entertainment, Microsoft,
  Nintendo ni à leurs filiales.
• L’app ne fournit pas de contournement de protections commerciales (DRM) et
  ne vend pas de jailbreak.
• Respecte les lois de ton pays et les conditions des plateformes ; n’utilise
  que du contenu dont tu as le droit.

Politique de confidentialité : https://lbxmb.fr/legal/rgpd
Site : https://lbxmb.fr
```

## Captures d’écran (consignes)

| Priorité | Contenu |
|---|---|
| 1 | Accueil / catalogue ressources |
| 2 | Liste ou détail d’un guide technique |
| 3 | Paramètres (thème, confidentialité, dossier DL) |
| 4 | Profil / favoris (sans données personnelles visibles) |
| Éviter | Écrans d’install de dumps, titres pirates, messages « crack / bypass » |

Formats usuels : téléphone 1080×1920 (ou ratios acceptés Play). Feature graphic
déjà dans le dépôt : `design/store/feature-graphic.png` (1024×500).

## Catégorie / tags suggérés

- Catégorie : **Communauté** ou **Éducation** / **Bibliothèques et démos**
  (choisir celle qui colle le mieux à la revue)
- Tags : communauté, guides, ressources, homebrew documenté — éviter
  « pirater », « jeux gratuits », « ISO »

## Data safety (questionnaire Google) — guidance

Réponses à adapter si le backend change ; base actuelle de l’app :

| Question | Réponse indicative |
|---|---|
| Collecte des données | **Oui** (compte optionnel + analytics opt-in) |
| Données collectées | Voir lignes ci-dessous |
| Chiffrées en transit | **Oui** (HTTPS vers lbxmb.fr) |
| Suppression possible | Compte / données site via procédures lbxmb.fr ; données locales effaçables en désinstallant |
| Données partagées avec des tiers | Analytics Umami auto-hébergé (opt-in) — pas de vente |
| Obligatoire pour le fonctionnement | Compte **non** obligatoire pour parcourir le catalogue |

### Types de données (si l’utilisateur se connecte / accepte)

| Type Play | Détail app | Collecté | Partagé | Finalité |
|---|---|---|---|---|
| Infos personnelles (compte) | Identifiants compte lbxmb.fr | Oui (si login) | Non (hors infra LB’XMB) | Fonctionnalité app |
| Activité dans l’app | Événements analytics anonymes (Umami) | Oui (si consentement) | Non | Analytics |
| Fichiers et docs | Fichiers choisis par l’utilisateur (DL / FTP / PKG) | **Non** envoyés à LB’XMB — restent sur l’appareil / LAN | Non | — |
| Identifiants appareil | Non utilisés pour pub | Non (hors besoin technique push si activé) | — | — |

Notifications push : si activées, token géré pour les alertes LB’XMB — déclarer
sous « Identifiants de l’appareil » / « Autre » selon le formulaire du moment.
Favoris / historique hors compte : stockage **local** (pas « collecté » au sens
Play si jamais envoyé).

### Sécurité des données

- Pas de vente de données
- Pas de pub ciblée tierce
- Transferts FTP/PKG = **réseau local** utilisateur, hors serveurs LB’XMB

## Déclaration permissions (justificatifs internes)

| Permission | Pourquoi |
|---|---|
| `INTERNET` | API HTTPS lbxmb.fr, images, auth |
| `POST_NOTIFICATIONS` | Alertes optionnelles |
| `ACCESS_NETWORK_STATE` / `ACCESS_WIFI_STATE` | Détection réseau / IP LAN |
| `CHANGE_WIFI_MULTICAST_STATE` | Découverte console (beacon UDP) |
| Stockage legacy | **Bloqué** — SAF / partage uniquement |

Cleartext HTTP : uniquement LAN (voir `docs/eas-play-store.md`).

## Disclaimer (À propos / store)

> Non affilié à Sony, Microsoft ni Nintendo. Catalogue communautaire de
> ressources et guides techniques. Les transferts FTP et PKG s’effectuent sur
> le réseau local de l’utilisateur, vers une console qu’il a lui-même configurée.
