# Audit i18n (P-Stabilize)

État : `i18n/locales/fr.json` + `en.json` couvrent surtout **onglets**, **settings**,
**auth**, **listes**, **widgets**, **lock**. Beaucoup d’écrans restent en FR en dur.

## Priorité (top à migrer)

| Zone | Exemples | Priorité |
|------|----------|----------|
| `app/parametres.tsx` | « Statistiques d’usage », « Stockage », « Fichiers téléchargés » | Haute (partiellement corrigé) |
| `app/a-propos.tsx` | Titres liste (Site, Code, API, CGU…) | Haute |
| `services/api/client.ts` / `ApiError` | Messages timeout, réseau | Haute |
| `services/ftp.ts` | Messages `FtpError` humanisés | Haute |
| Accueil / catalogue / FTP tab | Section headers, empty states | Moyenne |
| Forum / notifications / listes | Labels métier | Moyenne |
| Sheets changelog / WhatsNew | Contenu MD volontairement FR | Basse |

## Règle

- Nouveau texte UI → clé `i18n` FR+EN dans le même PR
- Messages d’erreur utilisateur → clés `errors.*` (à créer) plutôt que littéraux

## Couverture indicative

- Clés locales FR : ~70 lignes JSON (namespaces limités)
- Écrans `app/*.tsx` utilisant `useTranslation` : minorité (tabs, settings, widgets)
- Objectif post-stabilize : settings + a-propos + errors 100 % i18n
