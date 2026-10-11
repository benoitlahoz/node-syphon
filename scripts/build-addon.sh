#!/usr/bin/env bash

set -eu

BUILD_ARCH="${SYPHON_BUILD_ARCH:-universal}"
case "$BUILD_ARCH" in
  universal) ARCHS="arm64 x86_64" ;;
  intel) ARCHS="x86_64" ;;
  *)
    echo "Unsupported SYPHON_BUILD_ARCH: $BUILD_ARCH (expected universal or intel)." >&2
    exit 1
    ;;
esac

cd "$(dirname "$0")/.."
OUTPUT_DIR="$(pwd)/dist/bin"

rm -rf dist
mkdir dist

echo Building syphon.node with scheme \'Release\'...
cd build

# Need Xcode installed.
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"

# Build.
xcodebuild clean
xcodebuild -scheme "syphon" -target "syphon" -derivedDataPath .temp -configuration Release \
  CONFIGURATION_BUILD_DIR="$OUTPUT_DIR" ARCHS="$ARCHS" ONLY_ACTIVE_ARCH=NO

BINARY_ARCHS="$(lipo -archs "$OUTPUT_DIR/syphon.node")"
case "$BUILD_ARCH:$BINARY_ARCHS" in
  "universal:arm64 x86_64"|"universal:x86_64 arm64"|"intel:x86_64") ;;
  *)
    echo "Unexpected addon architectures: $BINARY_ARCHS (expected $ARCHS)." >&2
    exit 1
    ;;
esac
echo "$BINARY_ARCHS"

cd ..
rm -rf build

# Copy Syphon Framework to dist (to use package with yarn add link:/Users/.../node-syphon)
# This will not be published to npm, but is needed for local development.
mkdir dist/Frameworks
cp -R ./lib/Syphon.framework ./dist/Frameworks/Syphon.framework
