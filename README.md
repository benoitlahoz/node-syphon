# node-syphon

**WARNING: This package is VERY experimental. Use at your own risks.**

Experimental and superficial bindings between [`Syphon-Framework`](https://github.com/Syphon/Syphon-Framework) and `node.js`.

## Install

```sh
yarn add node-syphon
```

## Usage

This the monorepo `README`.

See library's [README.md](https://github.com/benoitlahoz/node-syphon/tree/main/packages/lib).
See [examples](https://github.com/benoitlahoz/node-syphon/tree/main/packages/examples).

## Build

Clone:
`git clone https://github.com/benoitlahoz/node-syphon.git`

Add Syphon:
`git submodule update --init`

In Syphon Framework's XCode project:

- Replace the _Dynamic Library Install Name_ property with this `@loader_path/../Frameworks/$(EXECUTABLE_PATH)`.
- Replace the _Dynamic Library Install Name Base_ property with this `@rpath`.
- Remove any code signing rule.

Install monorepo:
`yarn`

Bootstrap Lerna:
`lerna bootstrap`

Build library and examples:
`yarn build`

This will build Syphon, the node-addon and the JS library and copy everything in the `dist` folder.
