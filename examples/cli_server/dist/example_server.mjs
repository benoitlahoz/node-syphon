import { SyphonOpenGLServer } from "node-syphon";
let interval;
const test = () => {
  const serverOne = new SyphonOpenGLServer("test server 1");
  const serverTwo = new SyphonOpenGLServer("test server 2");
  console.log("Created", serverOne.serverDescription);
  console.log("Created", serverTwo.serverDescription);
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
  }, 1e3 / 60);
};
const sendToServer = (server, clamp = 255) => {
  const size = 50 * 50 * 4;
  let data = new Uint8ClampedArray(size);
  if (server) {
    for (let i = 0; i < size; i = i + 4) {
      data[i] = Math.floor(Math.random() * Math.min(255, clamp));
      data[i + 1] = Math.floor(Math.random() * Math.min(255, clamp));
      data[i + 2] = Math.floor(Math.random() * Math.min(255, clamp));
      data[i + 3] = 255;
    }
    server.publishImageData(
      data,
      "GL_TEXTURE_2D",
      // 'GL_TEXTURE_RECTANGLE_EXT', 'GL_TEXTURE_2D' // Doesn't work with GL_TECTURE°RECTANGLE
      { x: 0, y: 0, width: 50, height: 50 },
      { width: 50, height: 50 },
      false
    );
    data.set([]);
    data = null;
  }
};
test();
