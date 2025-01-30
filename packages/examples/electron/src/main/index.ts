import os from 'os';
import { app, shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { bootstrapSyphon, closeSyphon } from './syphon';

// https://stackoverflow.com/questions/55994212/how-use-the-returned-buffer-of-electronjs-function-getnativewindowhandle-i
function getNativeWindowHandle_Int(win) {
  let hbuf = win.getNativeWindowHandle();

  if (os.endianness() == 'LE') {
    console.log('ENDIAN LE');
    return hbuf.readInt32LE();
  } else {
    console.log('ENDIAN BE');
    return hbuf.readInt32BE();
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    console.log('Window handle', getNativeWindowHandle_Int(mainWindow));
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  process.on('SIGINT', () => {
    // Handle Cmd+C in dev mode.
    app.quit();
  });

  process.on('SIGTERM', () => {
    // Handle '--watch' main process reload in dev mode.
    app.quit();
  });

  // Bootstrap Syphon.
  bootstrapSyphon();

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  closeSyphon();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
