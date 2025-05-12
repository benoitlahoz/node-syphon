import { SyphonAddon } from '../../common/bindings';
import type { SyphonFrameData } from '../universal';
import type { SyphonServerDescription } from '../../common/types';

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
    this.listeners.length = 0;
    this.isFrameListenerSet = false;
    this.client.dispose(); // Will also remove addon's listener.
  }

  public on(channel: string, callback: (frame: SyphonFrameData) => void) {
    switch (channel) {
      case 'frame': {
        process.emitWarning(
          `SyphonOpenGLClient.on('frame') is deprecated. Use on('data') instead.`,
          'DeprecationWarning'
        );
      }
      case 'data': {
        if (!this.isFrameListenerSet) {
          // Set only one frame listener and prepare to dispatch to Javascript listeners.
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
        process.emitWarning(
          `SyphonOpenGLClient.off('frame') is deprecated. Use off('data') instead.`,
          'DeprecationWarning'
        );
      }
      case 'data': {
        const index = this.listeners.indexOf(callback);
        if (index >= 0) {
          this.listeners.splice(index, 1);

          if (this.listeners.length === 0) {
            this.client.off('frame');
            this.isFrameListenerSet = false;
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
