#!/usr/bin/env bash
# Build the Android CI image on the Forgejo runner host.
# Run from repo root or any cwd; does not push to a registry by default.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TAG="${ANDROID_BUILDER_IMAGE:-lbxmb-android-builder:sdk36-ndk27}"

echo "Building $TAG …"
docker build -t "$TAG" "$ROOT/ci/android-builder"
echo "Done. Image ready for release.yml (container.image: $TAG)."
docker images "$TAG" --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}'
