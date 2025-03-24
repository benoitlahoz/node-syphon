echo "Installing Syphon framework..."

BUILD = 0

if ! test -d ./dist; then
    echo "Installing package from GitHub..."
    mkdir dist
    
    BUILD = 1
fi

cd dist
mkdir Frameworks
cd Frameworks

curl -L https://github.com/benoitlahoz/node-syphon/releases/latest/download/SyphonFramework.zip -o SyphonFramework.zip
unzip ./SyphonFramework.zip

rm SyphonFramework.zip


    echo "Building package..."
    node-gyp configure && node-gyp build && yarn build:ts && yarn build:directory && rimraf build
