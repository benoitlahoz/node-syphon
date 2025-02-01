const { parentPort, workerData } = require('worker_threads');
const { SyphonMetalClient } = require('node-syphon');

let client;

parentPort.on('message', async (message) => {
  switch (message.cmd) {
    case 'connect': {
      if (client) {
        client.dispose(); // Will also remove listeners.
        client = null;
      }

      client = new SyphonMetalClient(message.server);

      client.on('frame', (frame) => {
        parentPort.postMessage({
          type: 'frame',
          frame,
        });

        // Just in case.
        frame.buffer = null;
        frame = null;
      });

      break;
    }

    case 'dispose': {
      if (client) {
        client.dispose();
        parentPort.postMessage({
          type: 'dispose',
        });
      }
    }
  }
});
