import { SyphonAddon } from '../common/addon';
import type { SyphonFrameData } from './universal';
import type { SyphonServerDescription } from '../common/types';

// TODO: Test with window handle.
export interface SyphonOpenGLClientConstructorOptions {
  server: SyphonServerDescription;
  handle?: Buffer;
}

export type { SyphonFrameData };

export class SyphonOpenGLClient {
  private client: any;
  private listeners: ((frame: SyphonFrameData) => void)[] = [];

  private isFrameListenerSet = false;

  constructor(description: SyphonServerDescription) {
    this.client = new SyphonAddon.OpenGLClient(description);
  }

  public dispose() {
    this.client.dispose();
  }

  public on(channel: string, callback: (frame: SyphonFrameData) => void) {
    switch (channel) {
      case 'frame': {
        if (!this.isFrameListenerSet) {
          this.client.on('frame', this.frameDataListenerCallback.bind(this));
          this.isFrameListenerSet = true;
        }
        this.listeners.push(callback);
        break;
      }
    }
  }

  public off(channel: string, callback: (data: Uint8ClampedArray) => void) {
    //
  }

  private frameDataListenerCallback(frame: SyphonFrameData): void {
    for (const listener of this.listeners) {
      listener(frame);
    }
  }
}
