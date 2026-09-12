#!/usr/bin/env bash
# Build the Android CI image on the Forgejo runner host.
# Also pushes to the local registry used by release.yml.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_TAG="${ANDROID_BUILDER_IMAGE:-lbxmb-android-builder:sdk36-ndk27}"
REGISTRY_TAG="${ANDROID_BUILDER_REGISTRY_IMAGE:-localhost:5001/lbxmb/android-builder:sdk36-ndk27}"

echo "Building $LOCAL_TAG …"
docker build -t "$LOCAL_TAG" "$ROOT/ci/android-builder"
docker tag "$LOCAL_TAG" "$REGISTRY_TAG"
echo "Pushing $REGISTRY_TAG …"
docker push "$REGISTRY_TAG"
echo "Done. release.yml expects: $REGISTRY_TAG"
docker images "$LOCAL_TAG" --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}'
