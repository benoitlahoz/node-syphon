# node-syphon

Experimental and superficial bindings between [`Syphon-Framework`](https://github.com/Syphon/Syphon-Framework) and `node.js`.

As of `v0.4.0` node-syphon provides ways to listen to servers' directory, **copy pixels** to a server and **get pixels** from a client. As it may not be very effective, see **TODO** section for texture binding (contributors welcome).

## Motivation

I've been using Syphon for years for my artistic work, with different applications: Quartz Composer, VDMX, Millumin, Processing, etc.
At the time of building my own multiplatform apps, using `Electron` and web technolgies, I want (and I need) Syphon to be a first class citizen of their visual workflow.

## Install

For the time being, `node-syphon` is not released as a `npm` package (see [here](https://stackoverflow.com/questions/79384958/publish-a-npm-package-that-contains-a-cocoa-framework-build)) and cannot be installed like this.

It can be installed with Syphon dependency via `yarn add https://github.com/benoitlahoz/node-syphon`.

## Build

Add Syphon:
`git submodule update --init`

In Syphon Framework's XCode project:

- Replace the _Dynamic Library Install Name_ property with this `@loader_path/../Frameworks/$(EXECUTABLE_PATH)`.
- Replace the _Dynamic Library Install Name Base_ property with this `@rpath`.
- Remove any code signing rule.

`yarn build`
This will build Syphon, the node-addon and the JS library and copy everythong in the `dist` folder.

## Usage

See [examples](https://github.com/benoitlahoz/node-syphon/tree/main/examples).

### Server

```typescript
import { SyphonOpenGLServer } from 'node-syphon';

// Create a server.
const server = new SyphonOpenGLServer('My awesome server');

const size = 50 * 50 * 4;
const clamp = 255;

let data: any = new Uint8ClampedArray(size);

// Generate random pixels.
for (let i = 0; i < size; i = i + 4) {
  data[i] = Math.floor(Math.random() * Math.min(255, clamp));
  data[i + 1] = Math.floor(Math.random() * Math.min(255, clamp));
  data[i + 2] = Math.floor(Math.random() * Math.min(255, clamp));
  data[i + 3] = 255;
}

// Send frames.
// Better ina worker.
const interval = setInterval(() => {
  server.publishImageData(
    data,
    'GL_TEXTURE_2D',
    { x: 0, y: 0, width: 50, height: 50 },
    { width: 50, height: 50 },
    false
  );
}, 1000 / 60);
```

### Client

```typescript
import {
  SyphonOpenGLClient,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
} from 'node-syphon';

const directory = new SyphonServerDirectory();

directory.on(
  SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
  (server: any) => {
    console.log('Server announce', server);
    console.log(directory.servers);
  }
);

directory.on(SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification, (server: any) => {
  console.log('Server retire', server);
  console.log(directory.servers);
});
directory.listen();

// Listen, to servers' 'announce' and 'retire', and 'newFrame'.
// Better in a worker.
const interval = setInterval(async () => {
  if (directory.servers.length > 0 && !client) {
    console.log('Create');
    client = new SyphonOpenGLClient(directory.servers[directory.servers.length - 1]);
  } else if (directory.servers.length === 0 && client) {
    console.log('Dispose');
    client.dispose();
    client = null;
  } else if (client) {
    console.log(await client.newFrame);
    console.log(client.width, client.height);
  }
}, 1000 / 60);
```

## TODO

- Explore new Electron's [`sharedTexture`](https://www.electronjs.org/docs/latest/api/structures/offscreen-shared-texture) to avoid copying pixels.
