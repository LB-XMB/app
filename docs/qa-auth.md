# QA auth — checklist (sideload)

À rejouer après chaque release et **après toute modification WAF Cloudflare**.

Build de référence : APK/IPA de la tag courante (ex. `v1.0.9`).

## Prérequis

- App fraîche ou compte de test
- Headers app actifs (voir `cloudflare-app-ua.md`)
- Smoke réseau (section ci-dessous) **vert** avant les scénarios UI

## Smoke Cloudflare / API

```bash
UA='LBXMB-App/1.0.9 (Android)'
BASE='https://lbxmb.fr'

# Doit répondre 200/4xx métier, jamais un challenge CF HTML
curl -sS -o /tmp/me.json -w '%{http_code}\n' \
  -H "User-Agent: $UA" -H 'X-LBXMB-Client: app' -H 'Origin: https://lbxmb.fr' \
  "$BASE/api/auth/me"

curl -sS -o /dev/null -w '%{http_code}\n' \
  -H "User-Agent: $UA" -H 'X-LBXMB-Client: app' -H 'Origin: https://lbxmb.fr' \
  -H 'Content-Type: application/json' \
  -d '{"username":"__qa_missing__","password":"x"}' \
  "$BASE/api/auth/sign-in/username"
```

Si le corps ressemble à une page Cloudflare / 403 WAF : **stop** — corriger la règle
`Allow LBXMB App auth` avant de tester l’app.

## Scénarios UI

| # | Plateforme | Scénario | Attendu |
|---|------------|----------|---------|
| 1 | Android | Login username/password | Session + onglet Profil connecté |
| 2 | Android | Register (si ouvert) | Compte créé ou message métier clair |
| 3 | Android | Continuer sur le site / Discord | Navigateur → `/app/autoriser` → retour app avec session |
| 4 | Android | Relancer l’app | Session conservée (`lbxmb.session`) |
| 5 | Android | Logout | Token effacé, écran connexion si prompt |
| 6 | iOS | Répéter 1, 3, 4 | Idem (Safari / ASWebAuthentication selon build) |
| 7 | Les deux | API catalogue sans auth | Liste ressources OK |

Cocher la date + version APK/IPA dans le message de release ou un ticket interne.

## Régression typique

- 403 soudain sur login → WAF / ordre des règles CF / UA manquant
- Poll QR qui expire → timeout `/api/auth/qr/*` ou Origin
- Session perdue → wipe MMKV / réinstall
