import { SyphonAddon } from '../../common/bindings';
import type { SyphonServerDescription } from '../../common/types';

export class SyphonMetalServer {
  private _server: any;

  private _dataDeprecationWarned = false;

  constructor(name: string) {
    this._server = new SyphonAddon.MetalServer(name);
  }

  public dispose() {
    this._server.dispose();
  }

  /**
   * @deprecated Use the new signature: `publishImageData(data, imageRegion, textureDimension, flipped)`.
   * This overload will be removed in a future release.
   */
  public publishImageData(
    data: Uint8ClampedArray,
    imageRegion: { x: number; y: number; width: number; height: number },
    bytesPerRow: number,
    flipped: boolean
  ): void;
  /**
   * Publish pixels data. Prefer this overload.
   */
  public publishImageData(
    data: Uint8ClampedArray,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void;
  public publishImageData(
    data: Uint8ClampedArray,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimensionOrBytesPerRow: { width: number; height: number } | number,
    flipped: boolean
  ): void {
    // Old / deprecated: (handle, textureTarget, imageRegion, textureDimension, flipped)
    if (typeof textureDimensionOrBytesPerRow === 'number') {
      if (process && process.emitWarning && !this._dataDeprecationWarned) {
        process.emitWarning(
          'SyphonMetalServer.publishImageData(data, imageRegion, bytePerRow, flipped) is deprecated. Use publishImageData(data, imageRegion, textureDimension, flipped) instead.',
          'DeprecationWarning'
        );
        this._dataDeprecationWarned = true;
      }

      // Handle deprecated signature and pass `imageRegion` size to `textureDimensions`.
      this._server.publishImageData(
        data,
        imageRegion,
        { width: imageRegion.width, height: imageRegion.height },
        flipped
      );
      return;
    }
    // New signature: (data, imageRegion, textureDimension, flipped)
    this._server.publishImageData(data, imageRegion, textureDimensionOrBytesPerRow, flipped);
  }

  public publishSurfaceHandle(
    handle: Buffer,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void {
    this._server.publishSurfaceHandle(handle, imageRegion, textureDimension, flipped);
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
