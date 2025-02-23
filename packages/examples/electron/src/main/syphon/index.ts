// import { join } from 'path';
// import { BrowserWindow, ipcMain, screen } from 'electron';
// import { SyphonOpenGLServer } from 'node-syphon';
import { ipcMain } from 'electron';
import { ElectronSyphonDirectory } from './electron-syphon.directory';
import { ServerDirectoryChannels } from '@/common/channels';

let directory: ElectronSyphonDirectory;

// let offscreenWindow: BrowserWindow | null;
// let offscreenServer: SyphonOpenGLServer | null;

export const bootstrapSyphon = async () => {
  await setupDirectory();
  return directory;
};

export const closeSyphon = () => {
  ipcMain.removeHandler(ServerDirectoryChannels.GetServers);
  if (directory) directory.dispose();

  // closeOffscreenServer();
};

const setupDirectory = async () => {
  try {
    directory = await ElectronSyphonDirectory.run();
    ipcMain.handle(ServerDirectoryChannels.GetServers, handleGetServers);
  } catch (err: unknown) {
    throw err;
  }
};

const handleGetServers = async () => {
  return directory.servers;
};

// https://stackoverflow.com/questions/55994212/how-use-the-returned-buffer-of-electronjs-function-getnativewindowhandle-i
/*
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
*/

/*
export const createTextureServer = () => {
  offscreenWindow = new BrowserWindow({
    width: 1920 / screen.getPrimaryDisplay().scaleFactor,
    height: 1080 / screen.getPrimaryDisplay().scaleFactor,
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

  offscreenWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/offscreen-server`);

  // InterWindowRTC.addClient('offscreen-server', offscreenWindow);

  // const textureServer = new ElectronSyphonGLServer('Handle');
  offscreenServer = new SyphonOpenGLServer('Offscreen');
  offscreenWindow.webContents.on('paint', (event: any, _size: any, _image) => {
    const tex = event.texture;
    if (offscreenServer && tex) {
      const handle = tex.textureInfo.sharedTextureHandle;

      offscreenServer.publishSurfaceHandle(
        handle,
        'GL_TEXTURE_RECTANGLE_EXT',
        tex.textureInfo.visibleRect,
        tex.textureInfo.codedSize,
        true,
      );

      tex.release();
    }
  });
};

export const closeOffscreenServer = () => {
  if (offscreenServer) {
    offscreenServer.dispose();
    offscreenServer = null;
  }

  if (offscreenWindow) {
    offscreenWindow.close();
    offscreenWindow = null;
  }
};
*/

// FIXME: Buffer is cloned and can't access IOSurfaceRef.
/*
      textureServer.publishSurfaceHandle({
        texture: handle,
        width: tex.textureInfo.codedSize.width,
        height: tex.textureInfo.codedSize.height,
      });
      */
