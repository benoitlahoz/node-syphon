export enum SyphonServerDirectoryListenerChannel {
  SyphonServerInfoNotification = 'syphon:server.info',
  SyphonServerErrorNotification = 'syphon:server.error',
  SyphonServerAnnounceNotification = 'syphon:server.announce',
  SyphonServerRetireNotification = 'syphon:server.retire',
  SyphonServerUpdateNotification = 'syphon:server.update',
}

export interface SyphonFrameData {
  buffer: Buffer;
  width: number;
  height: number;
}

export * from '../common/types';
