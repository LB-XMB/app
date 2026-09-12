# F-Droid — métadonnées de soumission

LB’XMB n’est **pas encore** dans le catalogue officiel F-Droid.
En attendant la revue, l’APK se met à jour via
[Obtainium](../README.md#installation) (source Forgejo — dépôt
`https://git.lbxmb.fr/lbxmb/app`, page des releases
`https://git.lbxmb.fr/lbxmb/app/releases`).

Ce fichier décrit ce qu’il faudra fournir pour une soumission
[`fdroiddata`](https://gitlab.com/fdroid/fdroiddata) :

| Champ | Valeur |
|---|---|
| Application ID | `fr.lbxmb.app` |
| Source | `https://git.lbxmb.fr/lbxmb/app` |
| Issues | `https://git.lbxmb.fr/lbxmb/app/issues` |
| Changelog | tags `v*` / releases Forgejo |
| Licence | à choisir (le dépôt porte encore le template Expo) |
| Binaires | APK attaché à chaque release : `lbxmb_*_android.apk` |

Tant que la licence du dépôt n’est pas clarifiée et que le build
reproductible n’est pas documenté, F-Droid refusera probablement
l’inclusion. Obtainium couvre le même besoin (mises à jour hors Play)
sans cette contrainte.
