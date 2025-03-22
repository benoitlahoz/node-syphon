# https://developer.apple.com/documentation/xcode/creating-a-static-framework # Xcode 15 only :-(
# https://stackoverflow.com/a/1937331/1060921 # Promising... To Explore.

readelf -d ./dist/bin/syphon.node
otool -D ./dist/Frameworks/Syphon.framework/Syphon
otool -L ./dist/Frameworks/Syphon.framework/Syphon