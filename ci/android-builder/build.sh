#!/usr/bin/env bash
# Build the Android CI image and push it to the LBXMB registry.
# release.yml pulls: game.lbxmb.fr:8443/lbxmb/android-builder:sdk36-ndk27
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_TAG="${ANDROID_BUILDER_IMAGE:-lbxmb-android-builder:sdk36-ndk27}"
REMOTE_TAG="${ANDROID_BUILDER_REMOTE:-game.lbxmb.fr:8443/lbxmb/android-builder:sdk36-ndk27}"

echo "Building $LOCAL_TAG …"
docker build -t "$LOCAL_TAG" "$ROOT/ci/android-builder"
docker tag "$LOCAL_TAG" "$REMOTE_TAG"
echo "Pushing $REMOTE_TAG …"
docker push "$REMOTE_TAG"
echo "Done. release.yml expects: $REMOTE_TAG"
docker images "$REMOTE_TAG" --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}'
