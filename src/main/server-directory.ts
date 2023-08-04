import { exec } from 'child_process';
import { join } from 'path';

import type { SyphonServerDescriptionPropertyKey, SyphonServerDescription } from '../common';

const COMMAND = `node ${join(process.cwd(), 'dist/server-directory-process.js')}`;

const EXIT_TYPES = [
  `exit`,
  `SIGINT`,
  `SIGUSR1`,
  `SIGUSR2`,
  `SIGQUIT`,
  `SIGSEGV`,
  `uncaughtException`,
  `SIGTERM`,
];

export enum SyphonServerDirectoryListenerChannel {
  SyphonServerAnnounceNotification = 'syphon:server.announce',
  SyphonServerRetireNotification = 'syphon:server.retire',
  SyphonServerUpdateNotification = 'syphon:server.update',
}

export const NodeSyphonMessageTypeKey = 'NodeSyphonMessageType';
export const NodeSyphonMessageKey = 'NodeSyphonMessage';

export const NodeSyphonMessageTypeInfo = 'NodeSyphonMessageInfo';
export const NodeSyphonMessageTypeError = 'NodeSyphonMessageError';
export const NodeSyphonMessageTypeNotification = 'NodeSyphonMessageNotification';

export const NodeSyphonNotificationTypeKey = 'NodeSyphonNotificationType';
export const NodeSyphonServerDictionaryKey = 'NodeSyphonServerDictionary';

export class SyphonServerDirectory {
  private static _instance: SyphonServerDirectory;

  private _serverDirectoryProcess: any;
  private _serverDirectoryRunning = false;

  private _servers: Array<SyphonServerDescription> = [];

  private _listeners: Record<
    SyphonServerDirectoryListenerChannel | any,
    Array<(...args: any[]) => void>
  > = {};

  constructor() {
    if (SyphonServerDirectory._instance) {
      return SyphonServerDirectory._instance;
    }

    SyphonServerDirectory._instance = this;
  }

  public dispose(): void {
    this.removeAllListeners();

    if (this._serverDirectoryProcess) {
      this._serverDirectoryProcess.kill();
      this._serverDirectoryProcess = null;
      this._servers.length = 0;

      this._serverDirectoryRunning = false;
    }
  }

  public on(channel: SyphonServerDirectoryListenerChannel, fn: (...args: any[]) => void): void {
    if (!this._listeners[channel]) {
      this._listeners[channel] = [];
    }
    this._listeners[channel].push(fn);
  }

  public off(channel: SyphonServerDirectoryListenerChannel, fn: (...args: any[]) => void): void {
    if (this._listeners[channel]) {
      const callback = this._listeners[channel].find((listener: any) => listener == fn);
      if (callback) {
        const index = this._listeners[channel].indexOf(callback);
        this._listeners[channel].splice(index, 1);
      }
    }
  }

  public removeAllListeners(): void {
    for (const channel in this._listeners) {
      this._listeners[channel].length = 0;
    }
  }

  public get isRunning(): boolean {
    return this._serverDirectoryRunning;
  }

  public get servers(): Array<SyphonServerDescription> {
    return this._servers;
  }

  public listen(): void {
    try {
      if (this._serverDirectoryRunning) {
        // Run once and only once, but allow adding listeners.
        return;
      }

      this._handleExit();

      // Actually run the Syphon servers listener.
      this._serverDirectoryProcess = exec(COMMAND);

      // Listens to process outputs.
      this._serverDirectoryProcess.stdout.setEncoding('utf8');
      this._serverDirectoryProcess.stdout.on('data', this._parseProcessData.bind(this));

      this._serverDirectoryRunning = true;
    } catch (err) {
      throw err;
    }
  }

  private _emit(channel: SyphonServerDirectoryListenerChannel, value: any): void {
    if (this._listeners[channel]) {
      for (const callback of this._listeners[channel]) {
        callback(value);
      }
    }
  }

  private _parseProcessData(data: any) {
    try {
      const obj = JSON.parse(data.toString());

      switch (obj.NodeSyphonMessageType) {
        case NodeSyphonMessageTypeInfo: {
          console.info(obj.NodeSyphonMessage);
          break;
        }
        case NodeSyphonMessageTypeError: {
          console.error(obj.NodeSyphonMessage);
          break;
        }
        case NodeSyphonMessageTypeNotification: {
          const type = obj.NodeSyphonMessage.NodeSyphonNotificationType;

          switch (type) {
            case 'SyphonServerAnnounceNotification': {
              /**
               * A server was added.
               */
              this._servers.push(obj.NodeSyphonMessage.NodeSyphonServerDictionary);
              this._servers = Array.from(new Set(this._servers));
              this._emit(
                SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
                obj.NodeSyphonMessage.NodeSyphonServerDictionary
              );
              break;
            }
            case 'SyphonServerRetireNotification': {
              /**
               * A server was removed.
               */
              const server = this._servers.find(
                (s: any) =>
                  s.SyphonServerDescriptionUUIDKey ==
                  obj.NodeSyphonMessage.NodeSyphonServerDictionary.SyphonServerDescriptionUUIDKey
              );

              if (server) {
                const index = this._servers.indexOf(server);
                this._servers.splice(index, 1);
                this._emit(
                  SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
                  obj.NodeSyphonMessage.NodeSyphonServerDictionary
                );
              }
              break;
            }
            case 'SyphonServerUpdateNotification': {
              /**
               * A server was updated.
               */
              // TODO: Untested, unable to find a Syphon server updating...
              const server = this._servers.find(
                (s: any) =>
                  s.SyphonServerDescriptionUUIDKey ==
                  obj.NodeSyphonMessage.NodeSyphonServerDictionary.SyphonServerDescriptionUUIDKey
              );

              if (server) {
                const index = this._servers.indexOf(server);
                this._servers.splice(index, 1, obj.NodeSyphonMessage.NodeSyphonServerDictionary);
                this._emit(
                  SyphonServerDirectoryListenerChannel.SyphonServerUpdateNotification,
                  obj.NodeSyphonMessage.NodeSyphonServerDictionary
                );
              }
              break;
            }
          }
          break;
        }
        default: {
          throw new Error(
            `Unhandled message type from ServerDirectory subprocess: ${obj.NodeSyphonMessageType}`
          );
        }
      }
    } catch (err) {
      throw err;
    }
  }

  private _handleExit(): void {
    process.stdin.resume();

    // Listen to exit signals.
    EXIT_TYPES.forEach((eventType) => {
      const end = () => {
        // FIXME: Pressing up arrow when running in command line sends a
        // signal which listener was not removed...
        if (this._serverDirectoryProcess) {
          this.dispose();

          // Clean process listeners.
          EXIT_TYPES.forEach((eventType) => {
            process.off(eventType, end);
          });
        }
      };

      process.on(eventType, end);
    });
  }
}
