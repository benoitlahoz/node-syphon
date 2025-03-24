#!/usr/bin/env bash

echo "Downloading Syphon framework..."

rm -rf lib
mkdir lib
cd lib

curl -L https://github.com/benoitlahoz/node-syphon/releases/latest/download/SyphonFramework.zip -o SyphonFramework.zip
unzip ./SyphonFramework.zip