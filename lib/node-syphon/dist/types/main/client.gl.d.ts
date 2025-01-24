import type { SyphonServerDescription } from '../common/types';
export declare class SyphonOpenGLClient {
    private _client;
    private _onFrameListeners;
    private _frameInterval;
    constructor(description: SyphonServerDescription);
    dispose(): void;
    on(channel: string, callback: (data: Uint8ClampedArray) => void): void;
    off(channel: string, callback: (data: Uint8ClampedArray) => void): void;
    get newFrame(): any;
    get width(): number;
    get height(): number;
}
