import { join } from 'node:path';
import { Worker } from 'worker_threads';
import { SyphonServerDescription } from 'node-syphon';
import SyphonServerWorkerURL from './metal-server.worker?worker&url';

export class ElectronSyphonMetalServer {
  public static async withName(name: string): Promise<ElectronSyphonMetalServer> {
    return new Promise((resolve, reject) => {
      try {
        const maxAttempts = 10;
        let attempt = 0;
        const server = new ElectronSyphonMetalServer(name);
        const interval = setInterval(() => {
          if (server.description) {
            clearInterval(interval);
            resolve(server);
          }

          attempt++;

          if (attempt === maxAttempts) {
            reject(new Error(`Could'nt get description for server with name '${name}'.`));
          }
        }, 20);
      } catch (err: unknown) {
        reject(err);
      }
    });
  }

  private worker: any;
  public description: SyphonServerDescription | undefined;

  private constructor(public readonly name: string) {
    this.worker = new Worker(join(__dirname, SyphonServerWorkerURL));
    this.worker.on('message', this.onWorkerMessage.bind(this));
    this.worker.on('error', (err: unknown) =>
      console.error(`Error in Metal server worker: ${err}`),
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

  private onWorkerMessage(payload: { type: string; data: any }) {
    switch (payload.type) {
      case 'server-description': {
        this.description = payload.data;
        break;
      }
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
