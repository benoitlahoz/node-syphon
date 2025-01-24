# node-syphon

Experimental and superficial bindings between [`Syphon-Framework`](https://github.com/Syphon/Syphon-Framework) and `node.js`.

## Motivation

I've been using Syphon for years for my artistic work, with different applications: Quartz Composer, VDMX, Millumin, Processing, etc.
At the time of building my own multiplatform apps, using `Electron` and web technolgies, I want (and I need) Syphon to be a first class citizen of their visual workflow.

## Install & Build

For the time being, `node-syphon` is not released as a `npm` package (see [here](https://stackoverflow.com/questions/79384958/publish-a-npm-package-that-contains-a-cocoa-framework-build)) and cannot be installed like this.

Add Syphon:
`git submodule update --init`

In Syphon Framework's XCode project:

- Replace the _Dynamic Library Install Name_ property with this `@loader_path/../Frameworks/$(EXECUTABLE_PATH)`.
- Replace the _Dynamic Library Install Name Base_ property with this `@rpath`.
- Remove any code signing rule.

`yarn build`
This will build Syphon, the node-addon and the JS library and copy everythong in the `dist` folder.

## TODO

- Explore new Electron's [`sharedTexture`](https://www.electronjs.org/docs/latest/api/structures/offscreen-shared-texture).
