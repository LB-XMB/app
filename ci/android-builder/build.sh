#!/usr/bin/env bash
# Build the Android CI image on the Forgejo runner host.
# release.yml uses the local tag only (no registry pull).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TAG="${ANDROID_BUILDER_IMAGE:-lbxmb-android-builder:sdk36-ndk27}"

echo "Building $TAG …"
docker build -t "$TAG" "$ROOT/ci/android-builder"
echo "Done. release.yml expects local image: $TAG (force_pull: false)."
docker images "$TAG" --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}'
