import { BrowserWindow, Menu, MenuItem } from 'electron';
import { ElectronSyphonDirectory } from './syphon/electron-syphon.directory';
import { createOpenGLDataClient } from './syphon/opengl-data';
import { createMetalDataClient } from './syphon/metal-data';
import { createOpenGLOffscreen } from './syphon/opengl-offscreen';

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
        if (checked !== item.id) {
          const windows = BrowserWindow.getAllWindows();

          createOpenGLDataClient(directory);
          checked = item.id;

          for (const window of windows) {
            window.close();
            window.destroy();
          }
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
        if (checked !== item.id) {
          const windows = BrowserWindow.getAllWindows();

          createMetalDataClient(directory);
          checked = item.id;

          for (const window of windows) {
            window.close();
            window.destroy();
          }
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
        if (checked !== item.id) {
          const windows = BrowserWindow.getAllWindows();

          createOpenGLOffscreen();
          checked = item.id;

          for (const window of windows) {
            window.close();
            window.destroy();
          }
        }
      },
    };

    menu.append(
      new MenuItem({
        label: MenuLabel,
        submenu: [openGLDataItem, metalDataItem, openGLOffscreenItem],
      }),
    );

    Menu.setApplicationMenu(menu);
  }
};
