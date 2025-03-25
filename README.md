# node-syphon

Superficial bindings between [`Syphon-Framework`](https://github.com/Syphon/Syphon-Framework) and `node.js`, that supports both Intel and Silicon architectures.

`node-syphon` provides Javascript functions to handle publishing and subcribing to Syphon textures in OpenGL and Metal as:

- Pixel buffers/arrays (`Uint8Array`).
- IOSurface handles in Electron (publish only).

---

- [node-syphon](#node-syphon)
  - [Install](#install)
  - [Examples](#examples)
  - [Usage](#usage)
    - [Client](#client)
    - [Server](#server)
        - [OpenGL](#opengl)
        - [Metal](#metal)
  - [Contribute](#contribute)
  - [Performances](#performances)
  - [TODO](#todo)

## Install

```sh
yarn add node-syphon
```

## Examples

- [Command line examples](https://github.com/benoitlahoz/node-syphon-cli-examples)
- [Electron pixel data & shared texture handle](https://github.com/benoitlahoz/node-syphon-electron-example)

## Usage

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

    if (directory.servers.length > 0 && !client) {
      console.log('Create');

      client = new SyphonOpenGLClient(directory.servers[directory.servers.length - 1]);

      client.on('frame', (frame: FrameDataDefinition) => {
        console.log('Frame received', frame);

        const buffer: Buffer = frame.buffer;
        const width: number = frame.width;
        const height: number = frame.height;

        // ...
      });
    }
  }
);

directory.on(SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification, (server: any) => {
  console.log('Server retire', server);
  console.log(directory.servers);
});

directory.listen();
```

### Server

##### OpenGL

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
const interval = setInterval(() => {
  server.publishImageData(
    data,
    'GL_TEXTURE_2D',

    // Region.

    { x: 0, y: 0, width: 50, height: 50 },

    // Size.

    { width: 50, height: 50 },

    // Flipped.

    false
  );
}, 1000 / 60);
```

##### Metal

```typescript
import { SyphonMetalServer } from 'node-syphon';

// Create a server.
const server = new SyphonMetalServer('My awesome server');

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
const interval = setInterval(() => {
  server.publishImageData(
    data,

    // Region.

    { x: 0, y: 0, width: 50, height: 50 },

    // Bytes per row.

    4 * 50,

    // Flipped.

    false
  );
}, 1000 / 60);
```

## Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## Performances

As of v0.6.1, the `electron` **client** example getting a **1920x1080** image from VDMX has a latency of **8 milliseconds** on a MacPro 2013.

## TODO

- [x] Flip texture vertically in the addon.
- [x] Test on Apple Silicon.
- [ ] Test the server description NSImage->Napi::Buffer.
- [x] Explore new Electron's [`sharedTexture`](https://www.electronjs.org/docs/latest/api/structures/offscreen-shared-texture) to avoid copying pixels.
- [ ] Library is unusable since we get a way to link to Syphon in users' packages: see
  - [ ] https://stackoverflow.com/a/27541535/1060921
- [ ] WebGPU Native to and from Browser.
