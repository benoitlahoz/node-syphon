import type { SyphonServerDescription } from '../common/types';
export type SyphonTextureTarget = 'GL_TEXTURE_RECTANGLE' | 'GL_TEXTURE_RECTANGLE_EXT' | 'GL_TEXTURE_2D';
export declare class SyphonOpenGLServer {
    private _server;
    constructor(name: string);
    dispose(): void;
    publishImageData(data: Uint8ClampedArray, textureTarget: SyphonTextureTarget, imageRegion: {
        x: number;
        y: number;
        width: number;
        height: number;
    }, textureDimension: {
        width: number;
        height: number;
    }, flipped: boolean): void;
    get name(): string;
    get serverDescription(): SyphonServerDescription;
    get hasClients(): boolean;
}
