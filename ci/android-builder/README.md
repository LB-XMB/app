# Image CI Android (`lbxmb-android-builder`)

Image Docker avec Node 22, JDK 17, Android SDK (platform 36), NDK et CMake.
Le job `android` du workflow release la tire depuis le registry LBXMB.

## Construire et publier

Sur une machine qui peut pusher vers `game.lbxmb.fr:8443` :

```bash
cd /chemin/vers/app
./ci/android-builder/build.sh
```

Image publiée / attendue par `.forgejo/workflows/release.yml` :

```text
game.lbxmb.fr:8443/lbxmb/android-builder:sdk36-ndk27
```

Pull public (déjà testé) : pas besoin de login côté runner pour tirer.

Ne pas utiliser `localhost:5001/...` ni un tag purement local : le runner
Forgejo n’a pas forcément l’image sur son daemon Docker.

Rebuild uniquement quand les pins SDK/NDK du `Dockerfile` changent.

## Gains attendus

| Setup | Durée typique |
|---|---|
| Ancien (sdkmanager à chaque run) | ~10–17 min |
| Image registry + arm64 | ~4–8 min |
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
