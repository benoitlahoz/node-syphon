import { join } from 'node:path';
import { Worker } from 'worker_threads';
import { SyphonFrameData, SyphonServerDescription } from 'node-syphon';
import type { SyphonGLFrameDTO } from '@/types';
import SyphonClientWorkerURL from './workers/gl-client.worker?worker&url';

export class ElectronSyphonGLClient {
  private worker: any;
  private currentFrame?: SyphonFrameData;
  private server: SyphonServerDescription | undefined;

  constructor() {
    this.worker = new Worker(join(__dirname, SyphonClientWorkerURL));
    this.worker.on('message', this.onWorkerMessage.bind(this));
    this.worker.on('error', (err: unknown) =>
      console.error(`Error in OpenGL client worker: ${err}`),
    );
  }

  public dispose() {
    this.worker.postMessage({
      cmd: 'dispose',
    });
    this.worker.terminate();
  }

  private onWorkerMessage(payload: SyphonGLFrameDTO) {
    switch (payload.type) {
      case 'frame': {
        this.currentFrame = payload.frame;
        break;
      }
    }
  }

  public connect(server: SyphonServerDescription) {
    this.server = server;
    this.worker.postMessage({
      cmd: 'connect',
      server,
    });
  }

  public get frame(): SyphonFrameData | undefined {
    return this.currentFrame;
  }

  public get serverUUID(): string {
    return this.server?.SyphonServerDescriptionUUIDKey || '';
  }
}
