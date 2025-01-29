import { FrameDataDefinition } from 'node-syphon';

export interface SyphonGLFrameDTO {
  type: 'frame';
  frame: FrameDataDefinition;
}
