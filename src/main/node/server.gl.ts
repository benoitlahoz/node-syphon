import { SyphonAddon } from '../../common/bindings';
import type { SyphonServerDescription } from '../../common/types';

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

  /**
   * @deprecated Use the new signature: publishSurfaceHandle(handle, imageRegion, textureDimension, flipped, textureTarget?)
   * with textureTarget as the last (optional) argument. This overload will be removed in a future release.
   */
  public publishSurfaceHandle(
    handle: Buffer,
    textureTarget: SyphonTextureTarget,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void;

  /**
   * Publishes a surface handle. Prefer this overload. (textureTarget is optional and only used for OpenGL)
   */
  public publishSurfaceHandle(
    handle: Buffer,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean,
    textureTarget?: SyphonTextureTarget
  ): void;

  public publishSurfaceHandle(
    handle: Buffer,
    imageRegion: { x: number; y: number; width: number; height: number } | SyphonTextureTarget,
    textureDimension: { width: number; height: number } | { x: number; y: number; width: number; height: number },
    flipped: boolean | { width: number; height: number },
    textureTarget?: SyphonTextureTarget | boolean
  ): void {
    // Old/deprecated: (handle, textureTarget, imageRegion, textureDimension, flipped)
    if (typeof imageRegion === 'string') {
      if (process && process.emitWarning) {
        process.emitWarning(
          'SyphonOpenGLServer.publishSurfaceHandle(handle, textureTarget, imageRegion, textureDimension, flipped) is deprecated. Use publishSurfaceHandle(handle, imageRegion, textureDimension, flipped, textureTarget?) instead.',
          'DeprecationWarning'
        );
      }
      this._server.publishSurfaceHandle(
        handle,
        imageRegion,
        textureDimension as { x: number; y: number; width: number; height: number },
        flipped as { width: number; height: number },
        textureTarget as boolean
      );
      return;
    }
    // New signature: (handle, imageRegion, textureDimension, flipped, textureTarget?)
    this._server.publishSurfaceHandle(
      handle,
      (typeof textureTarget === 'string' ? textureTarget : 'GL_TEXTURE_RECTANGLE_EXT'),
      imageRegion as { x: number; y: number; width: number; height: number },
      textureDimension as { width: number; height: number },
      flipped as boolean
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
