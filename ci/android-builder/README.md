# Image CI Android (`lbxmb-android-builder`)

Image Docker avec Node 22, JDK 17, Android SDK (platform 36), NDK et CMake.
Le job `android` du workflow release l’utilise pour **ne plus télécharger** le
SDK à chaque tag.

## Construire (sur l’hôte du runner Forgejo)

```bash
cd /chemin/vers/app
./ci/android-builder/build.sh
```

Tag produit / attendu par `.forgejo/workflows/release.yml` :
`lbxmb-android-builder:sdk36-ndk27`.

Image **strictement locale** : pas de registry. Avec `force_pull: false` sur le
runner, Docker démarre l’image déjà présente sans `docker pull`.

Ne pas référencer `localhost:5001/...` dans le workflow : Docker tente d’abord
HTTPS vers le registry et échoue (`connection refused`).

Rebuild uniquement quand les pins SDK/NDK du `Dockerfile` changent.

## Gains attendus

| Setup | Durée typique |
|---|---|
| Ancien (sdkmanager à chaque run) | ~10–17 min |
| Image + arm64 | ~4–8 min |
| + volumes Gradle/npm (si `valid_volumes`) | ~3–6 min |

## Volumes de cache

Par défaut le runner Forgejo a `container.valid_volumes: []` : **aucun** `-v`
dans `container.options` du workflow n’est autorisé (échec immédiat à
« Set up job »). Pour réactiver des caches Gradle/npm :

1. Dans la config du runner, autoriser par ex. :
   ```yaml
   container:
     valid_volumes:
       - lbxmb-ci-gradle
       - lbxmb-ci-npm
   ```
2. Remettre dans le job `android` :
   ```yaml
   options: >-
     -v lbxmb-ci-gradle:/root/.gradle
     -v lbxmb-ci-npm:/root/.npm
   ```

Sans ça, le gain principal reste l’image pré-cuite + arm64 seul.
