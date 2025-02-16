import { app, shell, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { bootstrapSyphon, closeSyphon, createTextureServer } from './syphon';

app.commandLine.appendSwitch('enable-unsafe-webgpu');

// @ts-ignore Value never read.
let clientWindow: BrowserWindow;
let serverWindow: BrowserWindow;

function createWindow(route: string): BrowserWindow {
  let win = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    trafficLightPosition: { x: 9, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  win.on('close', () => {
    closeSyphon(false);
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${route}`);
  } else {
    win.loadFile(`${join(__dirname, '../renderer/index.html')}`); // TODO: Routes.
  }

  return win;
}

app.whenReady().then(() => {
  process.on('SIGINT', () => {
    // Handle Ctrl+C in dev mode.
    app.quit();
  });

  process.on('SIGTERM', () => {
    // Handle '--watch' main process reload in dev mode.
    app.quit();
  });

  // Bootstrap Syphon.
  bootstrapSyphon();

  // Listen to 'open server window'.
  ipcMain.on('open-server', (_, type: 'gl' | 'metal' | 'osr') => {
    if (!serverWindow || serverWindow.isDestroyed()) {
      serverWindow = createWindow(
        type === 'gl' ? '/gl-server' : type === 'osr' ? '/onscreen-server' : '/metal-server',
      );
      const pos = serverWindow.getPosition();
      serverWindow.setPosition(pos[0] - 50, pos[1] - 50);
    }
  });

  clientWindow = createWindow('/');

  const menu = Menu.getApplicationMenu();

  if (menu) {
    let checked = 'opengl-shared';

    const implGLData = {
      label: 'OpenGL (shared)',
      id: 'opengl-shared',
      type: 'radio' as any,
      checked: true,
      accelerator: 'CmdOrCtrl+Shift+G',
      click(item: MenuItem) {
        if (checked !== item.id) {
          if (serverWindow) serverWindow.close();
          if (clientWindow) clientWindow.close();

          clientWindow = createWindow('/');
          checked = item.id;
        }
        /*
        if (item.checked) {
          const glShared = Menu.getApplicationMenu()!.getMenuItemById('opengl-shared');
          const metalData = Menu.getApplicationMenu()!.getMenuItemById('metal-data');
          glShared!.checked = false;
          metalData!.checked = false;

          if (serverWindow) serverWindow.close();
          if (clientWindow) clientWindow.close();

          clientWindow = createWindow('/');
          
        }
          */
      },
    };

    const implGLShared = {
      label: 'OpenGL (data)',
      id: 'opengl-data',
      type: 'radio' as any,
      checked: false,
      accelerator: 'CmdOrCtrl+Shift+O',
      click(item: MenuItem) {
        if (checked !== item.id) {
          if (serverWindow) serverWindow.close();
          if (clientWindow) clientWindow.close();

          clientWindow = createWindow('/gl-client');
          checked = item.id;
        }
      },
    };

    const implMetalData = {
      label: 'Metal (data)',
      id: 'metal-data',
      type: 'radio' as any,
      checked: false,
      accelerator: 'CmdOrCtrl+Shift+M',
      click(item: MenuItem) {
        if (checked !== item.id) {
          if (serverWindow) serverWindow.close();
          if (clientWindow) clientWindow.close();

          clientWindow = createWindow('/metal-client');
          checked = item.id;
        }
      },
    };

    menu.append(
      new MenuItem({
        label: 'Implementations',
        submenu: [implGLData, implGLShared, implMetalData],
      }),
    );

    Menu.setApplicationMenu(menu);
  }

  // TODO: Create windows implementations.
  // createTextureServer();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) clientWindow = createWindow('/');
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
