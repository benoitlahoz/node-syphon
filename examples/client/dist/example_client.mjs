import { SyphonServerDirectory, SyphonServerDirectoryListenerChannel, SyphonOpenGLClient } from "node-syphon";
let interval;
let directory;
let client;
const test = () => {
  try {
    process.stdin.resume();
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(
      (eventType) => {
        process.on(eventType, () => {
          if (client || directory) {
            console.log("End program", eventType);
            clearInterval(interval);
            directory == null ? void 0 : directory.dispose();
            client == null ? void 0 : client.dispose();
            directory = null;
            client = null;
          }
        });
      }
    );
    directory = new SyphonServerDirectory();
    directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
      (server) => {
        console.log("SERVER ANNOUNCE", server);
        console.log(directory.servers);
      }
    );
    directory.on(
      SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
      (server) => {
        console.log("SERVER RETIRE", server);
        console.log(directory.servers);
      }
    );
    directory.listen();
    interval = setInterval(() => {
      if (directory.servers.length > 0 && !client) {
        console.log("GO");
        client = new SyphonOpenGLClient(directory.servers[directory.servers.length - 1]);
      } else if (directory.servers.length === 0 && client) {
        console.log("GO DISP");
        client.dispose();
        client = null;
      } else if (client) {
        console.log(client.newFrame);
        console.log(client.width, client.height);
      }
    }, 1e3 / 60);
  } catch (err) {
    console.error(err);
    process.exit(0);
  }
};
test();
