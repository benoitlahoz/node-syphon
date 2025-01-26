const { parentPort, workerData } = require('worker_threads');
const { SyphonOpenGLClient } = require('node-syphon');

let client;

parentPort!.on('message', async (message) => {
  switch (message.cmd) {
    case 'connect': {
      if (client) {
        client.dispose();
      }

      client = new SyphonOpenGLClient(message.server);
      client.on('frame', (frame) => {
        parentPort.postMessage({
          type: 'frame',
          data: frame,
          width: client.width,
          height: client.height,
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
