export enum SyphonServerDirectoryListenerChannel {
  SyphonServerInfoNotification = 'info',
  SyphonServerErrorNotification = 'error',
  SyphonServerAnnounceNotification = 'announce',
  SyphonServerRetireNotification = 'retire',
  SyphonServerUpdateNotification = 'update',
}

export interface SyphonFrameData {
  buffer: Buffer;
  width: number;
  height: number;
}

export * from '../common/types';
