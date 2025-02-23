import { fork } from 'child_process';
import type { ChildProcess } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import type { SyphonServerDescription } from '../../common';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Launch from this 'dist' folder.
const PATH = `${resolve(__dirname, 'server-directory-process.js')}`;

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

import { SyphonServerDirectoryListenerChannel } from '../universal';
export { SyphonServerDirectoryListenerChannel };

export const NodeSyphonMessageTypeKey = 'NodeSyphonMessageType';
export const NodeSyphonMessageKey = 'NodeSyphonMessage';

export const NodeSyphonMessageTypeInfo = 'NodeSyphonMessageInfo';
export const NodeSyphonMessageTypeError = 'NodeSyphonMessageError';
export const NodeSyphonMessageTypeNotification = 'NodeSyphonMessageNotification';

export const NodeSyphonNotificationTypeKey = 'NodeSyphonNotificationType';
export const NodeSyphonServerDictionaryKey = 'NodeSyphonServerDictionary';

export class SyphonServerDirectory {
  private static instance: SyphonServerDirectory;

  private directoryProcess: ChildProcess;
  private directoryRunning = false;

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
    if (SyphonServerDirectory.instance) {
      return SyphonServerDirectory.instance;
    }

    SyphonServerDirectory.instance = this;
  }

  public dispose(): void {
    this.removeAllListeners();

    if (this.directoryProcess) {
      this.directoryProcess.kill();
      this.directoryProcess = null;
      this._servers.length = 0;

      this.directoryRunning = false;
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
    return this.directoryRunning;
  }

  public get servers(): SyphonServerDescription[] {
    return this._servers;
  }

  public get debug(): { path: string; pid: number } {
    return {
      path: PATH,
      pid: this.directoryProcess.pid,
    };
  }

  /**
   * Listens to servers' directory changes.
   */
  public listen(): void {
    try {
      if (this.directoryRunning) {
        // Run once and only once, but allow adding listeners.
        return;
      }

      this.handleExitSignal();

      // Actually run the Syphon servers listener.
      this.directoryProcess = fork(PATH, {
        silent: true,
      });

      this._emit(
        SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
        `Syphon directory server process launched with pid: ${this.directoryProcess.pid}`
      );

      // Node addon will convert Syphon's server directory dictionary into a parsable JSON string.
      this.directoryProcess.stdout.setEncoding('utf8');
      this.directoryProcess.stdout.on('data', this._parseProcessData.bind(this));

      this.directoryProcess.stderr.setEncoding('utf8');
      this.directoryProcess.stderr.on('data', (err: any) => {
        throw new Error(err.toString());
      });

      this._emit(
        SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
        `SyphonServerDirectory will set 'running: true`
      );

      this.directoryRunning = true;
    } catch (err) {
      this._emit(SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification, err);
      this.dispose();
      console.error(err);
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
      // Addon outputs a string that ends by new line.
      const split = data.toString().split(/\r?\n/);
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
      console.error(err);
      throw err;
    }
  }

  private handleExitSignal(): void {
    process.stdin.resume();

    // Listen to exit signals.
    EXIT_TYPES.forEach((eventType) => {
      const end = () => {
        if (this.directoryProcess) {
          console.log('Exit with event type', eventType);
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
