import { SyphonAddon } from '../common/addon';

import type { SyphonServerDescription } from '../common/types';

export class SyphonOpenGLClient {
  private _client: any;
  private _onFrameListeners: Array<(data?: Uint8ClampedArray) => void>;
  private _frameInterval: any;

  constructor(description: SyphonServerDescription) {
    this._client = new SyphonAddon.OpenGLClient(description);
    this._onFrameListeners = [];
  }

  public dispose() {
    if (this._frameInterval) {
      clearInterval(this._frameInterval);
    }
    this._onFrameListeners.length = 0;
    this._client.dispose();
  }

  public on(channel: string, callback: (data: Uint8ClampedArray) => void) {
    // this._client.on(channel, callback);
    switch (channel) {
      case 'frame': {
        if (!this._frameInterval) {
          // Begin loop.
          this._frameInterval = setInterval(() => {
            for (const fn of this._onFrameListeners) {
              fn(this.newFrame);
            }
          }, 1000 / 60);
        }
        this._onFrameListeners.push(callback);
      }
    }
  }

  public off(channel: string, callback: (data: Uint8ClampedArray) => void) {
    switch (channel) {
      case 'frame': {
        const listener = this._onFrameListeners.find((listener: any) => listener === callback);
        if (listener) {
          const index = this._onFrameListeners.indexOf(listener);
          this._onFrameListeners.splice(index, 1);
        }

        if (this._onFrameListeners.length === 0) {
          clearInterval(this._frameInterval);
        }
      }
    }
  }

  public get newFrame(): any {
    return new Uint8ClampedArray(this._client.newFrame);
  }

  public get width(): number {
    return this._client.width;
  }

  public get height(): number {
    return this._client.height;
  }
}
