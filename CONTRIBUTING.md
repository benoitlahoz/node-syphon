# Contributing

- [Contributing](#contributing)
  - [Clone the repository](#clone-the-repository)
  - [Install framework dependency](#install-framework-dependency)
    - [Download and install universal Syphon framework](#download-and-install-universal-syphon-framework)
    - [Build custom Syphon](#build-custom-syphon)
      - [Prerequisites](#prerequisites)
      - [Clone and build Syphon framework](#clone-and-build-syphon-framework)

## Clone the repository

```sh
git clone https://github.com/benoitlahoz/node-syphon.git
```

## Install framework dependency

When contributing to `node-syphon` development, user may want to install or rebuild the node addon, that requires Syphon framework.

The simple way is to download our custom build for Intel and Silicon, but future usages may need to rebuild the framework from scratch. Here is how to do it.

### Download and install universal Syphon framework

`sudo sh ./scripts/install-syphon.sh`

This will download the latest release of our custom build of the framework and unzip it in the `lib` folder.

### Build custom Syphon

#### Prerequisites

Xcode and its command line tools must be installed:

- https://apps.apple.com/us/app/xcode/id497799835?mt=12
- User can directly install command line tools ffrom Xcode itself or run `xcode-select --install`

#### Clone and build Syphon framework

```sh
sudo sh ./scripts/build-syphon.sh Release
```

This will build Syphon in the `lib` folder and zip it, preserving symbolic links. Note that the archive file is only needed if you wish to update the downloadble binary as a release in your fork.
