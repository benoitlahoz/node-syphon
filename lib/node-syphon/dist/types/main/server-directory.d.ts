import type { SyphonServerDescription } from '../common';
export declare enum SyphonServerDirectoryListenerChannel {
    SyphonServerInfoNotification = "syphon:server.info",
    SyphonServerErrorNotification = "syphon:server.error",
    SyphonServerAnnounceNotification = "syphon:server.announce",
    SyphonServerRetireNotification = "syphon:server.retire",
    SyphonServerUpdateNotification = "syphon:server.update"
}
export declare const NodeSyphonMessageTypeKey = "NodeSyphonMessageType";
export declare const NodeSyphonMessageKey = "NodeSyphonMessage";
export declare const NodeSyphonMessageTypeInfo = "NodeSyphonMessageInfo";
export declare const NodeSyphonMessageTypeError = "NodeSyphonMessageError";
export declare const NodeSyphonMessageTypeNotification = "NodeSyphonMessageNotification";
export declare const NodeSyphonNotificationTypeKey = "NodeSyphonNotificationType";
export declare const NodeSyphonServerDictionaryKey = "NodeSyphonServerDictionary";
export declare class SyphonServerDirectory {
    private static _instance;
    private _serverDirectoryProcess;
    private _serverDirectoryRunning;
    private _servers;
    private _listeners;
    constructor();
    dispose(): void;
    on(channel: SyphonServerDirectoryListenerChannel, fn: (...args: any[]) => void): void;
    off(channel: SyphonServerDirectoryListenerChannel, fn: (...args: any[]) => void): void;
    removeAllListeners(): void;
    get isRunning(): boolean;
    get servers(): Array<SyphonServerDescription>;
    listen(): void;
    private _emit;
    private _parseProcessData;
    private _handleExit;
}
