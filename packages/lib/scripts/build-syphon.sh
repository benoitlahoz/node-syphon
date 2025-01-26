#!/usr/bin/env bash

CONFIG=${1?Error: No input configuration (Debug or Release) provided.}

echo Building Syphon with scheme \'$CONFIG\'...

# Go to Syphon directory from the project's root.
cd ../../Syphon-Framework

# rm syphon.$CONFIG.xcconfig

# Need XCode instaalled.
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

xcodebuild clean 

# xcodebuild -list

# Export configuration file.
# xcodebuild -scheme "Syphon" -target "Syphon" -configuration $CONFIG -showBuildSettings >> syphon.$CONFIG.xcconfig
# sed -i '' -e '1,8d' syphon.$CONFIG.xcconfig
# sed -i '' 's+@rpath\/Syphon.framework/Versions/A/Syphon+@loader_path/../Frameworks/Syphon.framework/Versions/A/Syphon+g' syphon.$CONFIG.xcconfig


# Build.
# xcodebuild -scheme "Syphon" -target "Syphon" -arch x86_64 -derivedDataPath .temp -configuration $CONFIG -xcconfig syphon.$CONFIG.xcconfig CONFIGURATION_BUILD_DIR=../dist/Frameworks
# xcodebuild -scheme "Syphon" -arch x86_64 -derivedDataPath .temp CONFIGURATION_BUILD_DIR=build/$CONFIG

xcodebuild -scheme "Syphon" -target "Syphon" -arch x86_64 -derivedDataPath .temp -configuration $CONFIG CONFIGURATION_BUILD_DIR=../packages/lib/dist/Frameworks

# Clean-up.
rm -rf DerivedData 
rm -rf .temp
rm -rf ../packages//lib/dist/Frameworks/Syphon.framework.dSYM