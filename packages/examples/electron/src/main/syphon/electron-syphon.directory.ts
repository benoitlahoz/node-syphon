import { webContents } from 'electron';
import { SyphonServerDescription, SyphonServerDirectory } from 'node-syphon';
import { SyphonServerDirectoryListenerChannel } from 'node-syphon';

export class ElectronSyphonDirectory {
  private directory: SyphonServerDirectory;

  constructor() {
    this.directory = new SyphonServerDirectory();

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
      (message: string) => {
        this.notifyAll.bind(this)(
          SyphonServerDirectoryListenerChannel.SyphonServerInfoNotification,
          message,
        );
      },
    );

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification,
      (message: string) => {
        this.notifyAll.bind(this)(
          SyphonServerDirectoryListenerChannel.SyphonServerErrorNotification,
          message,
        );
      },
    );

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
      (message: SyphonServerDescription) => {
        this.notifyAll.bind(this)(
          SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
          message,
        );
      },
    );

    this.directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
      (message: SyphonServerDescription) => {
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
