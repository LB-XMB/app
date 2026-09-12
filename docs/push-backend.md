# Push mobile — besoin backend

L’app gère déjà :

- notifications **locales** de fin de téléchargement (`expo-notifications`, opt-in) ;
- une **inbox** forum via `GET/POST /api/notifications` (session Bearer), sans push distant.

Le site utilise du **Web Push** (`pushSubscription` dans `/api/notifications/preferences`).
Ce format ne fonctionne pas sur iOS/Android sideload via Expo.

## Pour du vrai push app

Il faudrait côté backend :

1. Enregistrement d’un token **Expo Push** (ou FCM/APNs) par appareil + utilisateur.
2. Endpoint dédié (ex. `POST /api/app/push-tokens`) hors Web Push.
3. Envoi via Expo Push Service / FCM lors des événements forum déjà couverts par
   `forum_notifications`.

Sans ça, l’app reste en local + inbox à l’ouverture.
