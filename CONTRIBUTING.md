# Contributing

- [Contributing](#contributing)
  - [Clone the repository](#clone-the-repository)
  - [Install framework dependency](#install-framework-dependency)
    - [1. Download and install universal Syphon framework](#1-download-and-install-universal-syphon-framework)
    - [2. Or build custom Syphon](#2-or-build-custom-syphon)
      - [Prerequisites](#prerequisites)
      - [Clone and build Syphon framework](#clone-and-build-syphon-framework)
    - [3. Build the addon](#3-build-the-addon)

## Clone the repository

```sh
git clone https://github.com/benoitlahoz/node-syphon.git
```

## Install framework dependency

When contributing to `node-syphon` development, user will need to rebuild the node addon, that requires Syphon framework.

The simple way to get it is to download our custom build for Intel and Silicon, but future usages may need to rebuild the framework from scratch. Here is how to do it.

### 1. Download and install universal Syphon framework

`sudo sh ./scripts/install-syphon.sh`

This will download the latest release of our custom build of the framework and unzip it in the `lib` folder.
Go to step 3.

### 2. Or build custom Syphon

#### Prerequisites

Xcode (not only its command line tools) must be installed:

- https://apps.apple.com/us/app/xcode/id497799835?mt=12
- Install command line tools from Xcode itself (`Xcode -> Open Developer Tool -> More Developer Tools...`)

#### Clone and build Syphon framework

```sh
sudo sh ./scripts/build-syphon.sh Release
```

This will build Syphon in the `lib` folder and zip it, preserving symbolic links. Note that the archive file is only needed if you wish to update the downloadble binary as a release in your fork.
Go to step 3.

### 3. Build the addon

- Make sure you have [a supported version of Python](https://devguide.python.org/versions/) installed.

```sh
yarn build
```

The native addon is built as a universal macOS binary (`x86_64` and `arm64`).
The build fails if either architecture is missing. The Syphon framework in `lib`
must also support both architectures.

To verify the final binary after the complete build:

```sh
lipo -archs dist/bin/syphon.node
```

The output must contain `x86_64` and `arm64` (in either order).

To build an Intel-only addon, including the JavaScript bundles:

```sh
yarn build:intel
lipo -archs dist/bin/syphon.node
```

The output must be exactly `x86_64`. This can also be built on Apple Silicon,
but loading it requires an Intel (`x86_64`) Node.js or Electron runtime.
The copied Syphon framework remains universal and is compatible with Intel.
Both commands replace `dist`; run `yarn build` again to restore the universal addon.
