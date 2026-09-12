# Image CI Android (`lbxmb-android-builder`)

Image Docker avec Node 22, JDK 17, Android SDK (platform 36), NDK et CMake.
Le job `android` du workflow release l’utilise pour **ne plus télécharger** le
SDK à chaque tag.

## Construire (sur l’hôte du runner Forgejo)

```bash
cd /chemin/vers/app
./ci/android-builder/build.sh
```

Tag produit : `lbxmb-android-builder:sdk36-ndk27`, aussi poussé vers
`localhost:5001/lbxmb/android-builder:sdk36-ndk27` (référencé par
`.forgejo/workflows/release.yml`).

L’image reste **locale** sur l’hôte du runner (`docker images`). Le nom
`lbxmb-android-builder:sdk36-ndk27` ne doit **pas** être tiré de Docker Hub
(`force_pull: false` côté runner, souvent déjà le cas).

Optionnel : pousser aussi sur le registry local :
```bash
docker tag lbxmb-android-builder:sdk36-ndk27 localhost:5001/lbxmb/android-builder:sdk36-ndk27
docker push localhost:5001/lbxmb/android-builder:sdk36-ndk27
```
puis pointer le workflow sur `localhost:5001/lbxmb/android-builder:sdk36-ndk27`.

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
