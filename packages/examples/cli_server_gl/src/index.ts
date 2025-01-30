import { SyphonOpenGLServer } from 'node-syphon';

let interval;
const test = () => {
  const serverOne = new SyphonOpenGLServer('OpenGL Server 1');
  const serverTwo = new SyphonOpenGLServer('OpenGL Server 2');

  // SIGSEV when parameter.
  serverOne.on('frame', (frame: Uint8Array) => {
    console.log('Hey', frame);
  });
  /*
  serverOne.on('frame', (frame: Uint8Array) => {
    console.log('Ho', frame);
  });
  */
  console.log('Created', serverOne.description);
  console.log('Created', serverTwo.description);

  // It's up to the user to deallocate the server.
  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, () => {
      serverOne.dispose();
      serverTwo.dispose();
      clearInterval(interval);
    });
  });

  interval = setInterval(() => {
    sendToServer(serverOne);
    sendToServer(serverTwo, 128);
  }, 1000 / 60);
};

const sendToServer = (server: SyphonOpenGLServer, clamp = 255) => {
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
      server.publishImageData(
        data,
        'GL_TEXTURE_2D',
        { x: 0, y: 0, width: 50, height: 50 },
        { width: 50, height: 50 },
        false
      );
    } catch (err) {
      console.error(err);
    }

    data.set([]);
    data = null;
  }
};

test();
