import { SyphonFrameData } from 'node-syphon';

export interface SyphonGLFrameDTO {
  type: 'frame';
  frame: SyphonFrameData;
}
