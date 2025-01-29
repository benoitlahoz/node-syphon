import { join } from 'node:path';
import { Worker } from 'worker_threads';
import { ipcMain } from 'electron';
import { SyphonFrameData, SyphonServerDescription } from 'node-syphon';
import type { SyphonGLFrameDTO } from '@/types';
import SyphonClientWorkerURL from './workers/gl-client.worker?worker&url';

export class ElectronSyphonGLClient {
  private _worker: any;
  private _currentFrame?: SyphonFrameData;

  constructor() {
    this._worker = new Worker(join(__dirname, SyphonClientWorkerURL));
    this._worker.on('message', this.onWorkerMessage.bind(this));
    this._worker.on('error', (err: unknown) =>
      console.error(`Error in OpenGL client worker: ${err}`),
    );

    // Client will pull the frame at its own pace (requestAnimationFrame).
    ipcMain.handle('get-frame', (_event: Electron.IpcMainInvokeEvent) => {
      return this._currentFrame;
    });
  }

  public dispose() {
    this._worker.postMessage({
      cmd: 'dispose',
    });
    this._worker.terminate();
  }

  private onWorkerMessage(payload: SyphonGLFrameDTO) {
    switch (payload.type) {
      case 'frame': {
        this._currentFrame = payload.frame;
        break;
      }
    }
  }

  public connect(server: SyphonServerDescription) {
    this._worker.postMessage({
      cmd: 'connect',
      server,
    });
  }
}
