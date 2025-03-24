echo "Installing Syphon framework..."

if ! test -d ./dist; then
    mkdir dist
fi

cd dist
mkdir Frameworks
cd Frameworks

curl -L https://github.com/benoitlahoz/node-syphon/releases/latest/download/SyphonFramework.zip -o SyphonFramework.zip
unzip ./SyphonFramework.zip

rm SyphonFramework.zip