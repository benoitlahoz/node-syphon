import { join } from 'node:path';
import { Worker } from 'worker_threads';
import SyphonServerWorkerURL from './workers/gl-server.worker?worker&url';

export class ElectronSyphonGLServer {
  private worker: any;

  constructor(name: string) {
    this.worker = new Worker(join(__dirname, SyphonServerWorkerURL));
    this.worker.on('error', (err: unknown) =>
      console.error(`Error in OpenGL server worker: ${err}`),
    );
    this.worker.postMessage({
      cmd: 'connect',
      name,
    });
  }

  public dispose() {
    this.worker.postMessage({
      cmd: 'dispose',
    });
    this.worker.terminate();
  }

  public async publishFrameData(frame: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }): Promise<void> {
    await this.worker.postMessage({
      cmd: 'publish',
      frame,
    });
  }
}
