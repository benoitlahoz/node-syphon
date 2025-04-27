import { SyphonAddon } from '../../common/bindings';
import type { SyphonServerDescription } from '../../common/types';

export type SyphonTextureTarget = 'GL_TEXTURE_RECTANGLE_EXT' | 'GL_TEXTURE_2D';

export class SyphonMetalServer {
  private _server: any;

  constructor(name: string) {
    this._server = new SyphonAddon.MetalServer(name);
  }

  public dispose() {
    this._server.dispose();
  }

  public publishImageData(
    data: Uint8ClampedArray,
    imageRegion: { x: number; y: number; width: number; height: number },
    bytesPerRow: number,
    flipped: boolean
  ): void {
    this._server.publishImageData(data, imageRegion, bytesPerRow, flipped);
  }

  public publishSurfaceHandle(
    handle: Buffer,
    textureTarget: SyphonTextureTarget,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void {
    this._server.publishSurfaceHandle(
      handle,
      textureTarget,
      imageRegion,
      textureDimension,
      flipped
    );
  }


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
