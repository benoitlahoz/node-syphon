import type { SyphonServerDescription } from '../common/types';
export declare class SyphonMetalServer {
    private _server;
    constructor(name: string);
    dispose(): void;
    publishImageData(data: Uint8ClampedArray, imageRegion: {
        x: number;
        y: number;
        width: number;
        height: number;
    }, bytesPerRow: number, flipped: boolean): void;
    get name(): string;
    get serverDescription(): SyphonServerDescription;
    get hasClients(): boolean;
}
