import { SyphonAddon } from '../common';

class SyphonServerDirectorySingleton {
  private static _instance: SyphonServerDirectorySingleton;

  private _directory: any;

  constructor() {
    if (SyphonServerDirectorySingleton._instance) {
      return SyphonServerDirectorySingleton._instance;
    }

    SyphonServerDirectorySingleton._instance = this;
    this._directory = new SyphonAddon.ServerDirectory();
    this._directory.listen();
  }
}

const instance = new SyphonServerDirectorySingleton();
Object.freeze(instance);
export { instance as SyphonServerDirectory };
