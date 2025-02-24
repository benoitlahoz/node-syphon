import { join } from 'node:path';
import { BrowserWindow, screen, shell } from 'electron';
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
      sandbox: false, // Warning: Doesn't work in sandboxed environment because of import in preload script.
      backgroundThrottling: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    // open url in a browser and prevent default
    shell.openExternal(url);
    return { action: 'deny' };
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

export const createOffscreenWindow = (route: string, width = 1920, height = 1080) => {
  const win = new BrowserWindow({
    width: width / screen.getPrimaryDisplay().scaleFactor,
    height: height / screen.getPrimaryDisplay().scaleFactor,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      backgroundThrottling: false,
      offscreen: {
        useSharedTexture: true,
      },
    },
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${route}`);
  } else {
    win.loadFile(`${join(__dirname, '../renderer/index.html')}`, { hash: route.replace('/', '') });
  }

  return win;
};
