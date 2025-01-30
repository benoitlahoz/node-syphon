import { SyphonAddon } from '../common/addon';

import type { SyphonServerDescription } from '../common/types';

export type SyphonTextureTarget = 'GL_TEXTURE_RECTANGLE_EXT' | 'GL_TEXTURE_2D';

export class SyphonOpenGLServer {
  private _server: any;

  constructor(name: string) {
    this._server = new SyphonAddon.OpenGLServer(name);
  }

  public dispose() {
    this._server.dispose();
  }

  public publishImageData(
    data: Uint8ClampedArray,
    textureTarget: SyphonTextureTarget,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void {
    this._server.publishImageData(data, textureTarget, imageRegion, textureDimension, flipped);
  }

  /*
  public publishFrameTexture(
    handle: Buffer,
    textureTarget: SyphonTextureTarget,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void {
    this._server.publishFrameTexture(data, textureTarget, imageRegion, textureDimension, flipped);
  }
  */

  public get name(): string {
    return this._server.name;
  }

  public get description(): SyphonServerDescription {
    return this._server.serverDescription;
  }

  public get hasClients(): boolean {
    return this._server.hasClients;
  }
}
