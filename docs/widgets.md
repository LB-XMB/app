# Widgets écran d’accueil

## État actuel (Expo SDK 57)

- **Android** : widgets natifs via [`react-native-android-widget`](https://saleksovski.github.io/react-native-android-widget/)
  — **Stats communauté** et **Populaires**. Config plugin dans `app.config.ts`,
  rendu dans `widgets/`, tâche enregistrée depuis `index.js`.
- **iOS** : `expo-widgets` reporté (régression layout `@expo/ui` sur SDK 57).

Les données viennent de `services/widgetData.ts` (`/api/home` + `/api/stats/home`).
L’écran Widgets (À propos) affiche l’aperçu et pousse une MAJ des widgets Android
installés.

## Ajout / MAJ

1. Long-press écran d’accueil → widgets → chercher **LB'XMB**.
2. Ouvrir l’app (ou l’écran Widgets) pour forcer un refresh hors période système
   (minimum 30 min via `updatePeriodMillis`).
3. Tap d’une ligne Populaires → ouvre l’URL lbxmb.fr correspondante.
