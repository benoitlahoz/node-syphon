import { SyphonAddon } from '../common/addon';

import type { SyphonServerDescription } from '../common/types';

export class SyphonOpenGLClient {
  private _client: any;

  constructor(description: SyphonServerDescription) {
    this._client = new SyphonAddon.OpenGLClient(description);
  }

  public dispose() {
    this._client.dispose();
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
