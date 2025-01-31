import { SyphonAddon } from '../common/addon';
import type { SyphonFrameData } from './universal';
import type { SyphonServerDescription } from '../common/types';

// TODO: Test with window handle.
export interface SyphonMetalClientConstructorOptions {
  server: SyphonServerDescription;
  handle?: Buffer;
}

export type { SyphonFrameData };

export class SyphonMetalClient {
  private client: any;
  private listeners: ((frame: SyphonFrameData) => void)[] = [];

  private isFrameListenerSet = false;

  constructor(description: SyphonServerDescription) {
    this.client = new SyphonAddon.MetalClient(description);
  }

  public dispose() {
    this.listeners.length = 0;
    this.isFrameListenerSet = false;
    this.client.dispose(); // Will also remove addon's listener.
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

  public off(channel: string, callback: (frame: SyphonFrameData) => void) {
    switch (channel) {
      case 'frame': {
        const index = this.listeners.indexOf(callback);
        if (index >= 0) {
          this.listeners.splice(index, 1);

          if (this.listeners.length === 0) {
            this.client.off('frame');
          }
        }
        break;
      }
    }
  }

  private frameDataListenerCallback(frame: SyphonFrameData): void {
    for (const listener of this.listeners) {
      listener(frame);
    }
  }
}
