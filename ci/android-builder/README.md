# Image CI Android (`lbxmb-android-builder`)

Image Docker avec Node 22, JDK 17, Android SDK (platform 36), NDK et CMake.
Le job `android` du workflow release l’utilise pour **ne plus télécharger** le
SDK à chaque tag.

## Construire (sur l’hôte du runner Forgejo)

```bash
cd /chemin/vers/app
./ci/android-builder/build.sh
```

Tag produit : `lbxmb-android-builder:sdk36-ndk27` (doit matcher
`ANDROID_BUILDER_IMAGE` dans `.forgejo/workflows/release.yml`).

L’image reste **locale** sur l’hôte. Le runner doit pouvoir la démarrer sans
`docker pull` obligatoire (`force_pull: false` côté act_runner, souvent déjà le
cas).

Rebuild uniquement quand les pins SDK/NDK du `Dockerfile` changent.

## Gains attendus

| Setup | Durée typique |
|---|---|
| Ancien (sdkmanager à chaque run) | ~10–17 min |
| Image + volumes Gradle/npm + arm64 | ~3–8 min |

## Volumes de cache

Le job monte des volumes Docker nommés (`lbxmb-ci-gradle`, `lbxmb-ci-npm`) pour
réutiliser les caches entre releases sur le même runner. Un seul job Android à
la fois évite les corruptions de cache Gradle.
