import { SyphonAddon } from '../../common/bindings';
import type { SyphonFrameData } from '../universal';
import type { SyphonServerDescription } from '../../common/types';

// TODO: Test with window handle.
export interface SyphonMetalClientConstructorOptions {
  server: SyphonServerDescription;
}

export type { SyphonFrameData };

export class SyphonMetalClient {
  private client: any;
  private frameListeners: ((frame: SyphonFrameData) => void)[] = [];
  private textureListeners: ((texture: any) => void)[] = [];

  private isFrameListenerSet = false;
  private isTextureListenerSet = false;

  constructor(description: SyphonServerDescription) {
    this.client = new SyphonAddon.MetalClient(description);
  }

  public dispose() {
    this.frameListeners.length = 0;
    this.isFrameListenerSet = false;
    this.textureListeners.length = 0;
    this.isTextureListenerSet = false;
    this.client.dispose(); // Will also remove addon's listener.
  }

  public on(channel: string, callback: (frame: SyphonFrameData) => void) {
    switch (channel) {
      case 'frame': {
        process.emitWarning(
          `SyphonMetalClient.on('frame') is deprecated. Use on('data') instead.`,
          'DeprecationWarning'
        );
      }
      case 'data': {
        if (!this.isFrameListenerSet) {
          // Set only one frame listener and prepare to dispatch to Javascript listeners.
          this.client.on('frame', this.frameDataListenerCallback.bind(this));
          this.isFrameListenerSet = true;
        }
        this.frameListeners.push(callback);
        break;
      }
      case 'texture': {
        if (!this.isTextureListenerSet) {
          // Set only one frame listener and prepare to dispatch to Javascript listeners.
          this.client.on('texture', this.textureHandleListenerCallback.bind(this));
          this.isTextureListenerSet = true;
        }
        this.textureListeners.push(callback);
        break;
      }
    }
  }

  public off(channel: string, callback: (frame: SyphonFrameData) => void) {
    switch (channel) {
      case 'frame': {
        const index = this.frameListeners.indexOf(callback);
        if (index >= 0) {
          this.frameListeners.splice(index, 1);

          if (this.frameListeners.length === 0) {
            this.client.off('frame');
            this.isFrameListenerSet = false;
          }
        }
        break;
      }
      case 'texture': {
        const index = this.textureListeners.indexOf(callback);
        if (index >= 0) {
          this.textureListeners.splice(index, 1);

          if (this.textureListeners.length === 0) {
            this.client.off('texture');
            this.isTextureListenerSet = false;
          }
        }
        break;
      }
    }
  }

  private frameDataListenerCallback(frame: SyphonFrameData): void {
    for (const listener of this.frameListeners) {
      listener(frame);
    }
  }

  private textureHandleListenerCallback(frame: any): void {
    for (const listener of this.textureListeners) {
      listener({
        ...frame,
        release: () => {
          this.client.releaseTexture(frame.frameCount);
        },
      });
    }
  }
}
