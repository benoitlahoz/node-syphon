import { SyphonFrameData } from 'node-syphon';

export interface SyphonClientFrameDTO {
  type: 'frame';
  frame: SyphonFrameData;
}
