# Cloudflare — auth app mobile

L’app envoie sur **toutes** les requêtes API :

```text
User-Agent: LBXMB-App/<version> (Android|iOS)
X-LBXMB-Client: app
Origin: https://lbxmb.fr
```

Définis dans `services/api/config.ts` (`APP_USER_AGENT`, `APP_CLIENT_HEADER`),
appliqués par `services/api/client.ts`.

Les routes `/api/auth/qr/*` sont un **challenge web** (l’app ouvre le site, poll,
puis `claim`) — **pas** un QR code à scanner dans l’UI.

## Règle WAF (plan Free)

Security → WAF → Custom rules :

- **Nom** : `Allow LBXMB App auth`
- **Action** : Skip → All managed rules (+ Super Bot Fight Mode si besoin)
- **Ordre** : **en premier** (avant les blocks)

### Variante A (préférée)

```text
(
  starts_with(http.request.uri.path, "/api/auth/qr")
  or starts_with(http.request.uri.path, "/api/auth/sign-in")
  or starts_with(http.request.uri.path, "/api/auth/sign-up")
  or http.request.uri.path eq "/api/auth/me"
  or http.request.uri.path eq "/api/auth/logout"
  or http.request.uri.path eq "/api/auth/username-available"
  or http.request.uri.path eq "/api/auth/register-complete"
)
and (
  http.user_agent contains "LBXMB-App/"
  or http.request.headers["x-lbxmb-client"][0] eq "app"
)
```

### Variante B (fallback éditeur CF)

Si la variante A est rejetée par l’éditeur d’expressions Free :

```text
(
  starts_with(http.request.uri.path, "/api/auth/qr")
  or starts_with(http.request.uri.path, "/api/auth/sign-in")
  or starts_with(http.request.uri.path, "/api/auth/sign-up")
  or http.request.uri.path eq "/api/auth/me"
  or http.request.uri.path eq "/api/auth/logout"
  or http.request.uri.path eq "/api/auth/username-available"
  or http.request.uri.path eq "/api/auth/register-complete"
)
and (
  http.user_agent contains "LBXMB-App/"
  or any(http.request.headers["x-lbxmb-client"][*] eq "app")
)
```

Ne **pas** utiliser l’opérateur `matches` (indisponible ou limité sur Free).
Ne pas skipper tout `/api/*` ni tout le site sur cet UA : ce n’est pas un secret.

Après déploiement de la règle, tester depuis un build natif : `POST /api/auth/qr/create`
et `POST /api/auth/sign-in/username` doivent répondre sans 403 Cloudflare.

## Smoke curl (post-changement WAF)

```bash
UA='LBXMB-App/1.0.9 (Android)'
curl -sS -o /dev/null -w 'me=%{http_code}\n' \
  -H "User-Agent: $UA" -H 'X-LBXMB-Client: app' -H 'Origin: https://lbxmb.fr' \
  'https://lbxmb.fr/api/auth/me'
```

Checklist complète : `docs/qa-auth.md`.
