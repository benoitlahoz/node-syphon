import {
  SyphonOpenGLClient,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
} from 'node-syphon';

let interval;
let directory: SyphonServerDirectory;
let client: SyphonOpenGLClient;

const test = () => {
  try {
    process.stdin.resume();
    process.on('SIGINT', () => {
      console.log('SIGINT');
      directory?.dispose();
      client?.dispose();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM');
      directory?.dispose();
      client?.dispose();
      process.exit(0);
    });
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(
      (eventType) => {
        process.on(eventType, () => {
          console.log('Event', eventType);
          directory?.dispose();
          client?.dispose();
          process.exit(0);
        });
      }
    );

    directory = new SyphonServerDirectory();

    directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
      (server: any) => {
        console.log('Server announce', server);

        if (directory.servers.length > 0 && !client) {
          console.log('Create');
          client = new SyphonOpenGLClient(directory.servers[directory.servers.length - 1]);
          client.on('frame', (frame: { data: Buffer; width: number; height: number }) => {
            console.log(frame);
          });
        }
      }
    );

    directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
      (server: any) => {
        console.log('Server retire', server);
        console.log(directory.servers);
      }
    );
    directory.listen();
  } catch (err) {
    console.error(err);
    process.exit(0);
  }
};

test();
