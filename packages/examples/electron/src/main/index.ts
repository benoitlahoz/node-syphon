import { app, BrowserWindow } from 'electron';
import { is } from '@electron-toolkit/utils';
import { bootstrapSyphon, closeSyphon } from './syphon';
import { createMenu } from './menu';
import { createOpenGLDataClient } from './syphon/opengl-data';

app.commandLine.appendSwitch('enable-unsafe-webgpu');

app.whenReady().then(async () => {
  if (is.dev) {
    process.on('SIGINT', () => {
      // Handle Ctrl+C in dev mode.
      app.quit();
    });

    process.on('SIGTERM', () => {
      // Handle '--watch' main process reload in dev mode.
      app.quit();
    });
  }

  // Bootstrap Syphon and get servers directory.
  const directory = await bootstrapSyphon();
  createMenu(directory);
  createOpenGLDataClient(directory);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createOpenGLDataClient(directory);
  });
});

app.on('before-quit', () => {
  // Clean windows properly.
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    window.close();
    window.destroy();
  }

  closeSyphon();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
