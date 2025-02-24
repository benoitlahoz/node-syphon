import { BrowserWindow, Menu, MenuItem } from 'electron';
import { is } from '@electron-toolkit/utils';
import { ElectronSyphonDirectory } from './syphon/electron-syphon.directory';
import { createOpenGLDataClient } from './syphon/opengl-data';
import { createMetalDataClient } from './syphon/metal-data';
import { createOpenGLOffscreen } from './syphon/opengl-offscreen';
import { createWebRTCOffscreen } from './syphon/opengl-offscreen-webrtc';
import { createWebGPUOffscreen } from './syphon/webgpu';

const MenuLabel = 'Implementations';

const Implementation = {
  OpenGLData: {
    id: 'opengl-data',
    label: 'OpenGL Data',
    accelerator: 'CmdOrCtrl+Shift+O',
  },
  MetalData: {
    id: 'metal-data',
    label: 'Metal Data',
    accelerator: 'CmdOrCtrl+Shift+M',
  },
  OpenGLOffscreen: {
    id: 'opengl-offscreen',
    label: 'OpenGL Offscreen',
    accelerator: 'CmdOrCtrl+Shift+G',
  },
  WebRTCOffscreenItem: {
    id: 'webrtc-offscreen',
    label: 'WebRTC Offscreen',
    accelerator: 'CmdOrCtrl+Shift+W',
  },
  WebGPUOffscreenItem: {
    id: 'webgpu-offscreen',
    label: 'WebGPU Offscreen',
    accelerator: 'CmdOrCtrl+Shift+T',
  },
};

let checked = Implementation.OpenGLData.id;

export const createMenu = (directory: ElectronSyphonDirectory) => {
  const menu = Menu.getApplicationMenu();

  if (menu) {
    const openGLDataItem = {
      label: Implementation.OpenGLData.label,
      id: Implementation.OpenGLData.id,
      accelerator: Implementation.OpenGLData.accelerator,
      checked: checked === Implementation.OpenGLData.id,
      type: 'radio' as any,
      click: (item: MenuItem) => {
        try {
          if (checked !== item.id) {
            const windows = BrowserWindow.getAllWindows();

            createOpenGLDataClient(directory);
            checked = item.id;

            for (const window of windows) {
              if (!window.isDestroyed()) {
                window.close();
                window.destroy();
              }
            }
          }
        } catch (err: unknown) {
          console.error(err);
        }
      },
    };

    const metalDataItem = {
      label: Implementation.MetalData.label,
      id: Implementation.MetalData.id,
      accelerator: Implementation.MetalData.accelerator,
      checked: checked === Implementation.MetalData.id,
      type: 'radio' as any,
      click: (item: MenuItem) => {
        try {
          if (checked !== item.id) {
            const windows = BrowserWindow.getAllWindows();

            createMetalDataClient(directory);
            checked = item.id;

            for (const window of windows) {
              if (!window.isDestroyed()) {
                window.close();
                window.destroy();
              }
            }
          }
        } catch (err: unknown) {
          console.error(err);
        }
      },
    };

    const openGLOffscreenItem = {
      label: Implementation.OpenGLOffscreen.label,
      id: Implementation.OpenGLOffscreen.id,
      accelerator: Implementation.OpenGLOffscreen.accelerator,
      checked: checked === Implementation.OpenGLOffscreen.id,
      type: 'radio' as any,
      click: (item: MenuItem) => {
        try {
          if (checked !== item.id) {
            const windows = BrowserWindow.getAllWindows();

            createOpenGLOffscreen();
            checked = item.id;

            for (const window of windows) {
              if (!window.isDestroyed()) {
                window.close();
                window.destroy();
              }
            }
          }
        } catch (err: unknown) {
          console.error(err);
        }
      },
    };

    const webRTCOffscreenItem = {
      label: Implementation.WebRTCOffscreenItem.label,
      id: Implementation.WebRTCOffscreenItem.id,
      accelerator: Implementation.WebRTCOffscreenItem.accelerator,
      checked: checked === Implementation.WebRTCOffscreenItem.id,
      type: 'radio' as any,
      click: (item: MenuItem) => {
        try {
          if (checked !== item.id) {
            const windows = BrowserWindow.getAllWindows();

            createWebRTCOffscreen();
            checked = item.id;

            for (const window of windows) {
              if (!window.isDestroyed()) {
                window.close();
                window.destroy();
              }
            }
          }
        } catch (err: unknown) {
          console.error(err);
        }
      },
    };

    const webGPUOffscreenItem = {
      label: Implementation.WebGPUOffscreenItem.label,
      id: Implementation.WebGPUOffscreenItem.id,
      accelerator: Implementation.WebGPUOffscreenItem.accelerator,
      checked: checked === Implementation.WebGPUOffscreenItem.id,
      type: 'radio' as any,
      click: (item: MenuItem) => {
        try {
          if (checked !== item.id) {
            const windows = BrowserWindow.getAllWindows();

            createWebGPUOffscreen();
            checked = item.id;

            for (const window of windows) {
              if (!window.isDestroyed()) {
                window.close();
                window.destroy();
              }
            }
          }
        } catch (err: unknown) {
          console.error(err);
        }
      },
    };

    if (is.dev) {
      menu.append(
        new MenuItem({
          label: MenuLabel,
          submenu: [
            openGLDataItem,
            metalDataItem,
            openGLOffscreenItem,
            webRTCOffscreenItem,
            webGPUOffscreenItem,
          ],
        }),
      );
    } else {
      menu.append(
        new MenuItem({
          label: MenuLabel,
          submenu: [openGLDataItem, metalDataItem, openGLOffscreenItem, webRTCOffscreenItem],
        }),
      );
    }

    Menu.setApplicationMenu(menu);
  }
};
