import { join } from 'node:path';
import { Worker } from 'worker_threads';
import { SyphonFrameData, SyphonServerDescription } from 'node-syphon';
import type { SyphonClientFrameDTO } from '@/types';
import SyphonClientWorkerURL from './gl-client.worker?worker&url';

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
  }

  private onWorkerMessage(payload: SyphonClientFrameDTO | { type: string }) {
    switch (payload.type) {
      case 'frame': {
        this.currentFrame = (payload as SyphonClientFrameDTO).frame;
        break;
      }
      case 'dispose': {
        this.worker.terminate();
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
