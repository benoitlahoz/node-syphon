import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      setGlobal: (key: string, value: any) => void;
      getGlobal: (key: string) => any;
    };
  }
}
