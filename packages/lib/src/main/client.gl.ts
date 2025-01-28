import { SyphonAddon } from '../common/addon';

import type { SyphonServerDescription } from '../common/types';

// TODO: Test with window handle.
export interface SyphonOpenGLClientConstructorOptions {
  server: SyphonServerDescription;
  handle?: Buffer;
}

export interface FrameDataDefinition {
  buffer: Buffer;
  width: number;
  height: number;
}

export class SyphonOpenGLClient {
  private _client: any;

  constructor(description: SyphonServerDescription) {
    this._client = new SyphonAddon.OpenGLClient(description);
  }

  public dispose() {
    this._client.dispose();
  }

  public on(channel: string, callback: (frame: FrameDataDefinition) => void) {
    this._client.on(channel, callback);
  }

  public off(channel: string, callback: (data: Uint8ClampedArray) => void) {
    //
  }

  public async getFrame(): Promise<any> {
    const nativeBuffer: Buffer = await this._client.getFrame();
    return nativeBuffer.buffer;
  }
}
