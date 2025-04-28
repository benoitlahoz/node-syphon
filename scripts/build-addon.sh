#!/usr/bin/env bash

# Run as root early.
sudo rm -rf dist
mkdir dist

echo Building syphon.node with scheme \'Release\'...
cd build

# Need Xcode installed.
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Build.
xcodebuild clean
xcodebuild -scheme "syphon" -target "syphon" -derivedDataPath .temp -configuration Release CONFIGURATION_BUILD_DIR=./dist/bin

cd ..
rm -rf build

# Copy Syphon Framework to dist (to use package with yarn add link:/Users/.../node-syphon)
mkdir dist/Frameworks
cp -R ./lib/Syphon.framework ./dist/Frameworks/Syphon.framework

