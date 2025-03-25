# Contributing

- [Contributing](#contributing)
  - [Clone the repository](#clone-the-repository)
  - [Install framework dependency](#install-framework-dependency)
    - [Download and install universal Syphon framework](#download-and-install-universal-syphon-framework)
    - [Build custom Syphon](#build-custom-syphon)
      - [Prerequisites](#prerequisites)
      - [Clone and build Syphon framework](#clone-and-build-syphon-framework)
    - [Build the addon](#build-the-addon)

## Clone the repository

```sh
git clone https://github.com/benoitlahoz/node-syphon.git
```

## Install framework dependency

When contributing to `node-syphon` development, user will need to rebuild the node addon, that requires Syphon framework.

The simple way to get it is to download our custom build for Intel and Silicon, but future usages may need to rebuild the framework from scratch. Here is how to do it.

### Download and install universal Syphon framework

`sudo sh ./scripts/install-syphon.sh`

This will download the latest release of our custom build of the framework and unzip it in the `lib` folder.

### Build custom Syphon

#### Prerequisites

Xcode (not only its command line tools) must be installed:

- https://apps.apple.com/us/app/xcode/id497799835?mt=12
- Install command line tools from Xcode itself (`Xcode -> Open Developer Tool -> More Developer Tools...`)

#### Clone and build Syphon framework

```sh
sudo sh ./scripts/build-syphon.sh Release
```

This will build Syphon in the `lib` folder and zip it, preserving symbolic links. Note that the archive file is only needed if you wish to update the downloadble binary as a release in your fork.

### Build the addon

- Make sure you have [a supported version of Python](https://devguide.python.org/versions/) installed.

```sh
yarn build
```
