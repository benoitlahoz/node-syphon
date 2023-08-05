import {
  SyphonOpenGLClient, SyphonServerDirectory, SyphonServerDirectoryListenerChannel
} from 'node-syphon';
import { Server, Socket } from 'socket.io';
import { Messages } from '../../common';

let io = new Server(5557, {
  cors: {
    origin: '*',
  },
});

let directory: SyphonServerDirectory;

io.on('connection', (socket: Socket) => {
  console.log(`Connection: Socket connected with id ${socket.id}.`);

  if (directory) {
    socket.emit(Messages.AllServers, directory.servers);
  }

  socket.on('disconnecting', () => {
    console.log(`Socket with id ${socket.id} is disconnecting.`);
  });

  socket.on(Messages.GetAllServers, (callback: any) => {
    console.log('SOCK', directory.servers);
    callback(directory.servers);
  });
});

const runDirectoryServer = () => {
  directory = new SyphonServerDirectory();

  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerAnnounceNotification,
    (server: any) => {
      console.log('ANN');
      io.emit(Messages.ServerAnnounced, server);
    }
  );
  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerRetireNotification,
    (server: any) => {
      io.emit(Messages.ServerRetired, server);
    }
  );
  directory.on(
    SyphonServerDirectoryListenerChannel.SyphonServerUpdateNotification,
    (server: any) => {
      io.emit(Messages.ServerUpdated, server);
    }
  );

  directory.listen();

  process.stdin.resume();
  [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, () => {
      if (directory) {
        directory.dispose();
        directory = null;
      }
    });
  });
};

process.stdin.resume();
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, () => {
    if (io) {
      io.disconnectSockets();
      io.close();
      io = null;
    }

    if (directory) {
      directory.dispose();
      directory = null;
    }
  });
});

runDirectoryServer();
