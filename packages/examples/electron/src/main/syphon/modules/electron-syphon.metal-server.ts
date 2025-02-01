import { join } from 'node:path';
import { Worker } from 'worker_threads';
import SyphonServerWorkerURL from './workers/metal-server.worker?worker&url';

export class ElectronSyphonMetalServer {
  private worker: any;

  constructor(name: string) {
    this.worker = new Worker(join(__dirname, SyphonServerWorkerURL));
    this.worker.on('message', this.onWorkerMessage.bind(this));
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
  }

  private onWorkerMessage(payload: { type: string }) {
    switch (payload.type) {
      case 'dispose': {
        this.worker.terminate();
        break;
      }
    }
  }

  public async publishImageData(frame: {
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
