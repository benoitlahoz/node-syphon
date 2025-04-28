import { SyphonAddon } from '../../common/bindings';
import type { SyphonServerDescription } from '../../common/types';

export type SyphonTextureTarget = 'GL_TEXTURE_RECTANGLE_EXT' | 'GL_TEXTURE_2D';

export class SyphonOpenGLServer {
  private _server: any;

  private _dataDeprecationWarned = false;
  private _handleDeprecationWarned = false;

  constructor(name: string) {
    this._server = new SyphonAddon.OpenGLServer(name);
  }

  public dispose() {
    this._server.dispose();
  }

  /**
   * @deprecated Use the new signature: `publishImageData(data, imageRegion, textureDimension, flipped, textureTarget)`
   * with textureTarget as the last (optional) argument. This overload will be removed in a future release.
   */
  public publishImageData(
    data: Uint8ClampedArray,
    textureTarget: SyphonTextureTarget,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void;
  /**
   * Publish pixels data. Prefer this overload (textureTarget is optional and only used for OpenGL).
   */
  public publishImageData(
    data: Uint8ClampedArray,
    textureTarget: SyphonTextureTarget,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void;
  public publishImageData(
    data: Uint8ClampedArray,
    imageRegionOrTextureTarget:
      | { x: number; y: number; width: number; height: number }
      | SyphonTextureTarget,
    textureDimensionOrImageRegion:
      | { width: number; height: number }
      | { x: number; y: number; width: number; height: number },
    flippedOrTextureDimension: boolean | { width: number; height: number },
    textureTargetOrFlipped: SyphonTextureTarget | boolean
  ): void {
    // Old / deprecated: (handle, textureTarget, imageRegion, textureDimension, flipped)
    if (typeof imageRegionOrTextureTarget === 'string') {
      if (process && process.emitWarning && !this._dataDeprecationWarned) {
        process.emitWarning(
          'SyphonOpenGLServer.publishImageData(data, textureTarget, imageRegion, textureDimension, flipped) is deprecated. Use publishImageData(data, imageRegion, textureDimension, flipped, textureTarget?) instead.',
          'DeprecationWarning'
        );
        this._dataDeprecationWarned = true;
      }

      // Handle deprecated signature and reorder parameters to (data, imageRegion, textureDimension, flipped, textureTarget)
      this._server.publishImageData(
        data,
        textureDimensionOrImageRegion,
        flippedOrTextureDimension,
        textureTargetOrFlipped,
        imageRegionOrTextureTarget
      );
      return;
    }
    // New signature: (data, imageRegion, textureDimension, flipped, textureTarget?)
    this._server.publishImageData(
      data,
      imageRegionOrTextureTarget,
      textureDimensionOrImageRegion,
      flippedOrTextureDimension,
      typeof textureTargetOrFlipped === 'string'
        ? textureTargetOrFlipped
        : 'GL_TEXTURE_RECTANGLE_EXT'
    );
  }

  /**
   * @deprecated Use the new signature: `publishSurfaceHandle(handle, imageRegion, textureDimension, flipped, textureTarget)`
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
   * Publish a surface handle. Prefer this overload (textureTarget is optional and only used for OpenGL).
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
    imageRegionOrTextureTarget:
      | { x: number; y: number; width: number; height: number }
      | SyphonTextureTarget,
    textureDimensionOrImageRegion:
      | { width: number; height: number }
      | { x: number; y: number; width: number; height: number },
    flippedOrTextureDimension: boolean | { width: number; height: number },
    textureTargetOrFlipped: SyphonTextureTarget | boolean
  ): void {
    // Old / deprecated: (handle, textureTarget, imageRegion, textureDimension, flipped)
    if (typeof imageRegionOrTextureTarget === 'string') {
      if (process && process.emitWarning && this._handleDeprecationWarned) {
        process.emitWarning(
          'SyphonOpenGLServer.publishSurfaceHandle(handle, textureTarget, imageRegion, textureDimension, flipped) is deprecated. Use publishSurfaceHandle(handle, imageRegion, textureDimension, flipped, textureTarget?) instead.',
          'DeprecationWarning'
        );
        this._handleDeprecationWarned = true;
      }

      // Handle deprecated signature and reorder parameters to (handle, imageRegion, textureDimension, flipped, textureTarget)
      this._server.publishSurfaceHandle(
        handle,
        textureDimensionOrImageRegion,
        flippedOrTextureDimension,
        textureTargetOrFlipped,
        imageRegionOrTextureTarget
      );
      return;
    }
    // New signature: (handle, imageRegion, textureDimension, flipped, textureTarget?)
    this._server.publishSurfaceHandle(
      handle,
      imageRegionOrTextureTarget,
      textureDimensionOrImageRegion,
      flippedOrTextureDimension,
      typeof textureTargetOrFlipped === 'string'
        ? textureTargetOrFlipped
        : 'GL_TEXTURE_RECTANGLE_EXT'
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
