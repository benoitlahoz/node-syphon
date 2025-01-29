import {
  SyphonOpenGLClient,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel,
  SyphonFrameData,
} from 'node-syphon';

let directory: SyphonServerDirectory;
let client: SyphonOpenGLClient;

const listen = () => {
  try {
    process.stdin.resume();
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(
      (eventType) => {
        process.on(eventType, () => {
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
          client.on('frame', (frame: SyphonFrameData) => {
            console.log('FIRST', frame);
          });

          client.on('frame', (frame: SyphonFrameData) => {
            console.log('SECOND', frame);
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

listen();
