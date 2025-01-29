const { parentPort, workerData } = require('worker_threads');
const { SyphonOpenGLClient } = require('node-syphon');

let client;

parentPort!.on('message', async (message) => {
  switch (message.cmd) {
    case 'connect': {
      if (client) {
        client.dispose();
        // TODO: client.off -> FrameEeventListeners dispose.
      }

      client = new SyphonOpenGLClient(message.server);
      client.on('frame', (frame) => {
        parentPort.postMessage({
          type: 'frame',
          frame,
        });
      });

      break;
    }

    case 'dispose': {
      if (client) {
        client.dispose();
      }
    }
  }
});
