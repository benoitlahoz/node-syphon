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
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(
      (eventType) => {
        process.on(eventType, () => {
          if (client || directory) {
            console.log('End program', eventType);
            clearInterval(interval);
            directory?.dispose();
            client?.dispose();

            directory = null;
            client = null;
          }
        });
      }
    );

    directory = new SyphonServerDirectory();

    directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
      (server: any) => {
        console.log('Server announce', server);
        console.log(directory.servers);
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

    interval = setInterval(async () => {
      // console.log('YOP', directory.servers);
      if (directory.servers.length > 0 && !client) {
        console.log('Create');
        client = new SyphonOpenGLClient(directory.servers[directory.servers.length - 1]);
      } else if (directory.servers.length === 0 && client) {
        console.log('Dispose');
        client.dispose();
        client = null;
      } else if (client) {
        console.log(await client.newFrame);
        console.log(client.width, client.height);
      }
    }, 1000 / 60);
  } catch (err) {
    console.error(err);
    process.exit(0);
  }
};

test();
