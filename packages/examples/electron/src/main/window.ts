import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import { is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

export const createWindow = (route: string, width = 900, height = 600) => {
  const win = new BrowserWindow({
    width,
    height,
    minWidth: width,
    minHeight: height,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    trafficLightPosition: { x: 9, y: 10 },
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${route}`);
  } else {
    win.loadFile(`${join(__dirname, '../renderer/index.html')}`, { hash: route.replace('/', '') });
  }

  return win;
};
