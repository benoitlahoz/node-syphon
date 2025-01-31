import { SyphonMetalServer } from 'node-syphon';

let interval;
const test = () => {
  const serverOne = new SyphonMetalServer('Metal Server');
  console.log('Created', serverOne.description);

  // It's up to the user to deallocate the server.
  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, () => {
      serverOne.dispose();
      clearInterval(interval);
    });
  });

  interval = setInterval(() => {
    sendToServer(serverOne);
  }, 1000 / 60);
};

const sendToServer = (server: SyphonMetalServer, clamp = 255) => {
  const size = 50 * 50 * 4;
  let data: any = new Uint8ClampedArray(size);

  if (server) {
    for (let i = 0; i < size; i = i + 4) {
      data[i] = Math.floor(Math.random() * Math.min(255, clamp));
      data[i + 1] = Math.floor(Math.random() * Math.min(255, clamp));
      data[i + 2] = Math.floor(Math.random() * Math.min(255, clamp));
      data[i + 3] = 255;
    }

    try {
      server.publishImageData(data, { x: 0, y: 0, width: 50, height: 50 }, 4 * 50, false);
    } catch (err) {
      console.error(err);
    }

    data.set([]);
    data = null;
  }
};

test();
