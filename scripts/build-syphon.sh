#!/usr/bin/env bash

CONFIG=${1?Error: No input configuration (Debug or Release) provided.}

# Run as root early
sudo rm -rf lib
mkdir lib
cd lib

# Clone Syphon.
git clone https://github.com/Syphon/Syphon-Framework.git
cd Syphon-Framework

echo Building Syphon with scheme \'$CONFIG\'...

# Need Xcode installed.
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Build.
xcodebuild clean
xcodebuild -scheme "Syphon" -target "Syphon" -arch x86_64 -arch arm64 -derivedDataPath .temp -configuration $CONFIG CONFIGURATION_BUILD_DIR=../

# Clean-up build.
rm -rf DerivedData 
rm -rf .temp
rm -rf ../Syphon.framework.dSYM

# Zip while preserving symbolic links.
cd ..
zip -vry SyphonFramework.zip Syphon.framework/ -x "*.DS_Store"

# Final clean-up.
rm -rf Syphon-Framework

# TODO: See rpath, loader_path, etc. for our own executable https://itwenty.me/posts/01-understanding-rpath/