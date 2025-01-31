let canvas;
let fps = 0;
let ticks = 0;
let last = performance.now();

self.onmessage = async (event) => {
  const cmd = event.data.cmd;

  if (cmd === 'init') {
    canvas = event.data.canvas;
    return;
  }

  ticks++;

  canvas.width = event.data.width;
  canvas.height = event.data.height;

  const data = new ImageData(
    new Uint8ClampedArray(event.data.buffer),
    event.data.width,
    event.data.height,
  );

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, event.data.width, event.data.height);
  ctx.putImageData(data, 0, 0);

  if (ticks > 10) {
    // Every 10 ticks.

    // See here to enhance: https://github.com/overengineeringstudio/fps-meter/blob/main/src/index.tsx
    const now = performance.now();
    const diff = now - last;

    fps = Math.round(1000 / (diff / ticks));
    last = now;
    ticks = 0;

    self.postMessage({ type: 'fps', payload: fps });
  }
};
