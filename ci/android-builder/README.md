# Image CI Android (`android-builder`)

Image Docker avec Node 22, JDK 17, Android SDK (platform 36), NDK et CMake.
Le job `android` du workflow release la tire depuis **Docker Hub**.

## Construire et publier

```bash
docker login -u interverti
cd /chemin/vers/app
./ci/android-builder/build.sh
```

Image publiée / attendue par `.forgejo/workflows/release.yml` :

```text
interverti/android-builder:sdk36-ndk27
```

https://hub.docker.com/r/interverti/android-builder

Rebuild uniquement quand les pins SDK/NDK du `Dockerfile` changent.

## Gains attendus

| Setup | Durée typique |
|---|---|
| Ancien (sdkmanager à chaque run) | ~10–17 min |
| Image Docker Hub + arm64 | ~4–8 min |
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
