# Monitoring erreurs client (opt-in, amorce)

**Décision P-Stabilize :** pas d’intégration Sentry/Crashlytics pour l’instant.

Quand on l’activera :

- Uniquement si `settings.consent === 'full'` (même barre que Umami)
- Pas de PII / token session dans les payloads
- Désactivable depuis Paramètres → Confidentialité

Jusque-là : s’appuyer sur les reports utilisateurs + logs CI / API.
