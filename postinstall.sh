
echo "Installing Syphon framework..."

cd dist
mkdir Frameworks

curl -L https://github.com/benoitlahoz/node-syphon/releases/latest/download/SyphonFramework.zip -o SyphonFramework.zip
unzip ./SyphonFramework.zip

rm SyphonFramework.zip