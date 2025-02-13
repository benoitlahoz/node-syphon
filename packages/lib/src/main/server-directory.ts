import { exec } from 'child_process';
import type { ChildProcess } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import type { SyphonServerDescription } from '../common';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Launch from this 'dist' folder.
const COMMAND = `node ${join(__dirname, 'server-directory-process.js')}`;

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

import { SyphonServerDirectoryListenerChannel } from './universal';
export { SyphonServerDirectoryListenerChannel };

export const NodeSyphonMessageTypeKey = 'NodeSyphonMessageType';
export const NodeSyphonMessageKey = 'NodeSyphonMessage';

export const NodeSyphonMessageTypeInfo = 'NodeSyphonMessageInfo';
export const NodeSyphonMessageTypeError = 'NodeSyphonMessageError';
export const NodeSyphonMessageTypeNotification = 'NodeSyphonMessageNotification';

export const NodeSyphonNotificationTypeKey = 'NodeSyphonNotificationType';
export const NodeSyphonServerDictionaryKey = 'NodeSyphonServerDictionary';

export class SyphonServerDirectory {
  private static _instance: SyphonServerDirectory;

  private _serverDirectoryProcess: ChildProcess;
  private _serverDirectoryRunning = false;

  /**
   * Current servers in directory.
   */
  private _servers: SyphonServerDescription[] = [];

  /**
   * Listeners on servers' notifications.
   */
  private _listeners: Record<
    SyphonServerDirectoryListenerChannel | any,
    ((...args: any[]) => void)[]
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

  public get servers(): SyphonServerDescription[] {
    return this._servers;
  }

  /**
   * Listens to servers' directory changes.
   */
  public listen(): void {
    try {
      if (this._serverDirectoryRunning) {
        // Run once and only once, but allow adding listeners.
        return;
      }

      this._handleExit();

      // Actually run the Syphon servers listener.
      this._serverDirectoryProcess = exec(COMMAND);

      this._emit(
        SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
        `Syphon directory server process launched with pid: ${this._serverDirectoryProcess.pid}`
      );

      // Listens to process outputs.
      // Node addon will parse Syphon's server directory dictionary into a parsable JSON string.
      this._serverDirectoryProcess.stdout.setEncoding('utf8');
      this._serverDirectoryProcess.stdout.on('data', this._parseProcessData.bind(this));

      this._serverDirectoryRunning = true;
    } catch (err) {
      this._emit(SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification, err);
      this.dispose();
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
      // Addon outputs a string that ends, or is separated by this token.
      const split = data.toString().split('--__node-syphon-delimiter__--');
      let obj = [];

      for (const str of split) {
        if (str.trim().length === 0) continue;
        obj.push(JSON.parse(str));
      }

      for (const message of obj) {
        switch (message.NodeSyphonMessageType) {
          case NodeSyphonMessageTypeInfo: {
            this._emit(
              SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
              message.NodeSyphonMessage
            );
            break;
          }
          case NodeSyphonMessageTypeError: {
            this._emit(
              SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification,
              message.NodeSyphonMessage
            );
            break;
          }
          case NodeSyphonMessageTypeNotification: {
            const type = message.NodeSyphonMessage.NodeSyphonNotificationType;

            switch (type) {
              case 'SyphonServerAnnounceNotification': {
                /**
                 * A server was added.
                 */
                this._servers.push(message.NodeSyphonMessage.NodeSyphonServerDictionary);
                this._servers = Array.from(new Set(this._servers));
                this._emit(
                  SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
                  message.NodeSyphonMessage.NodeSyphonServerDictionary
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
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                      .SyphonServerDescriptionUUIDKey
                );

                if (server) {
                  const index = this._servers.indexOf(server);
                  this._servers.splice(index, 1);
                  this._emit(
                    SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                  );
                }
                break;
              }
              case 'SyphonServerUpdateNotification': {
                /**
                 * A server was updated.
                 */
                const server = this._servers.find(
                  (s: any) =>
                    s.SyphonServerDescriptionUUIDKey ==
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                      .SyphonServerDescriptionUUIDKey
                );

                if (server) {
                  const index = this._servers.indexOf(server);
                  this._servers.splice(
                    index,
                    1,
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                  );
                  this._emit(
                    SyphonServerDirectoryListenerChannel.SyphonServerUpdateNotification,
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                  );
                }

                break;
              }
            }
            break;
          }
          default: {
            throw new Error(
              `Unhandled message type from ServerDirectory subprocess: ${message.NodeSyphonMessageType}`
            );
          }
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
