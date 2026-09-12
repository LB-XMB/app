# Cloudflare — auth QR app mobile

L’app envoie un User-Agent fixe sur **toutes** les requêtes API :

```text
LBXMB-App/<version> (Android)
LBXMB-App/<version> (iOS)
```

Défini dans `services/api/config.ts` (`APP_USER_AGENT`), utilisé par `services/api/client.ts`
(donc `qr/create`, `status`, `claim`, `me`, `logout`, catalogue, forum, etc.).

## Règle WAF recommandée

Security → WAF → Custom rules :

- **Nom** : `Allow LBXMB App auth QR`
- **Expression** (stricte) :

```text
starts_with(http.request.uri.path, "/api/auth/qr")
and http.user_agent matches "^LBXMB-App/[0-9.]+ \((Android|iOS)\)$"
```

Variante un peu plus large (inclut `me` / `logout`) :

```text
(starts_with(http.request.uri.path, "/api/auth/qr")
  or http.request.uri.path eq "/api/auth/me"
  or http.request.uri.path eq "/api/auth/logout")
and http.user_agent matches "^LBXMB-App/[0-9.]+ \((Android|iOS)\)$"
```

- **Action** : Skip → All managed rules
- **Ordre** : avant les règles de block

Ne pas skipper tout `/api/*` ni tout le site sur cet UA : ce n’est pas un secret.
