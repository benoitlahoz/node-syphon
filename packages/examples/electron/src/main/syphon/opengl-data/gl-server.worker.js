const { parentPort, workerData } = require('worker_threads');
const { SyphonOpenGLServer } = require('node-syphon');

let server;

parentPort.on('message', async (message) => {
  switch (message.cmd) {
    case 'connect': {
      if (server) {
        server.dispose();
        server = null;
      }

      server = new SyphonOpenGLServer(message.name);

      parentPort.postMessage({
        type: 'server-description',
        data: server.description,
      });

      break;
    }

    case 'publish-data': {
      const frame = message.frame;

      server.publishImageData(
        frame.data,
        'GL_TEXTURE_2D',
        { x: 0, y: 0, width: frame.width, height: frame.height },
        { width: frame.width, height: frame.height },
        true,
      );
      message.frame.data = null;
      message.frame = null;
      break;
    }

    case 'publish-surface': {
      const frame = message.frame;
      const buffer = Buffer.from(frame.texture);

      // FIXME: Doesn't work, we may be losing data from the original handle.
      server.publishSurfaceHandle(
        // https://github.com/nodejs/node/issues/27266
        buffer,
        'GL_TEXTURE_RECTANGLE_EXT',
        { x: 0, y: 0, width: frame.width, height: frame.height },
        { width: frame.width, height: frame.height },
        true,
      );

      break;
    }

    case 'dispose': {
      if (server) {
        server.dispose();
        parentPort.postMessage({
          type: 'dispose',
        });
      }
    }
  }
});
