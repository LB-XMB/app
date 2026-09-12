# Widgets écran d’accueil

## État actuel (Expo SDK 57)

- **Android** : pas de support officiel via `expo-widgets`.
- **iOS** : `expo-widgets` existe mais présente une régression connue (`@expo/ui` /
  bundle widget) qui affiche une erreur de layout. Intégration **reportée**.

L’app expose déjà les données via `services/widgetData.ts` (`/api/home` +
`/api/stats/home`) et un aperçu in-app (écran Widgets depuis À propos).

## Quand reprendre

1. Vérifier que `expo-widgets` rend correctement sur un build SDK 57/58.
2. Ajouter le plugin + deux widgets : **Populaires** et **Stats communauté**.
3. Refresh lent (timeline) — pas de FTP / forum / compte dans les widgets.
