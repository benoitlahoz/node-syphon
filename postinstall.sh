echo "Installing Syphon framework..."

BUILD = false

if ! test -d ./dist; then
    echo "Installing package from GitHub..."
    mkdir dist
    
    "$BUILD" = true
fi

cd dist
mkdir Frameworks
cd Frameworks

curl -L https://github.com/benoitlahoz/node-syphon/releases/latest/download/SyphonFramework.zip -o SyphonFramework.zip
unzip ./SyphonFramework.zip

rm SyphonFramework.zip

if [ "$BUILD" = true ]; then
    echo "Building package..."
    node-gyp configure && node-gyp build && yarn build:ts && yarn build:directory && rimraf build
fi