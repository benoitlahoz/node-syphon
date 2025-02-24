import { webContents } from 'electron';
import {
  SyphonServerDescription,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
} from 'node-syphon';
import logToFile from 'electron-log';

export class ElectronSyphonDirectory {
  public static async run(): Promise<ElectronSyphonDirectory> {
    return new Promise((resolve, reject) => {
      try {
        const maxAttempts = 100;
        let attempt = 0;

        const directory = new ElectronSyphonDirectory();

        directory.listen();

        const interval = setInterval(() => {
          if (directory.isRunning) {
            clearInterval(interval);
            resolve(directory);
            return;
          }

          attempt++;

          if (attempt >= maxAttempts) {
            clearInterval(interval);
            reject(new Error(`Unable to run SyphonServerDirectory.`));
          }
        }, 200);
      } catch (err: unknown) {
        reject(err);
      }
    });
  }

  private directory: SyphonServerDirectory;

  private constructor() {
    this.directory = new SyphonServerDirectory();

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
      (message: string) => {
        logToFile.log('Info', message);

        this.notifyAll.bind(this)(
          SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
          message,
        );
      },
    );

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification,
      (message: string) => {
        logToFile.log('Error', message);

        this.notifyAll.bind(this)(
          SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification,
          message,
        );
      },
    );

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
      (message: SyphonServerDescription) => {
        logToFile.log('Announce', message);

        this.notifyAll.bind(this)(
          SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
          message,
        );
      },
    );

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
      (message: SyphonServerDescription) => {
        logToFile.log('Retire', message);

        this.notifyAll.bind(this)(
          SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
          message,
        );
      },
    );
  }

  public dispose(): void {
    this.directory.dispose();
  }

  public listen(): void {
    this.directory.listen();
  }

  public get servers(): SyphonServerDescription[] {
    return this.directory.servers;
  }

  public get isRunning(): boolean {
    return this.directory.isRunning;
  }

  public get debug(): { path: string; pid: number } {
    return this.directory.debug;
  }

  private notifyAll(channel: SyphonServerDirectoryListenerChannel, message: any): void {
    const contents = webContents.getAllWebContents();
    for (const webContent of contents) {
      webContent.send(channel, {
        message,
        servers: this.servers,
      });
    }
  }
}
