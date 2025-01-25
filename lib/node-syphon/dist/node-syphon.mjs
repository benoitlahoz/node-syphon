var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import bindings from "bindings";
import { exec } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const SyphonAddon = bindings({
  bindings: "syphon",
  // The bin folder from the lib one.
  try: [
    // For standard installation.
    ["module_root", "node_modules", "node-syphon", "dist", "bin", "syphon.node"],
    // For local examples.
    ["module_root", "dist", "bin", "syphon.node"]
  ]
});
class SyphonOpenGLServer {
  constructor(name) {
    __publicField(this, "_server");
    this._server = new SyphonAddon.OpenGLServer(name);
  }
  dispose() {
    this._server.dispose();
  }
  publishImageData(data, textureTarget, imageRegion, textureDimension, flipped) {
    this._server.publishImageData(data, textureTarget, imageRegion, textureDimension, flipped);
  }
  /*
  public publishFrameTexture(
    handle: Buffer,
    textureTarget: SyphonTextureTarget,
    imageRegion: { x: number; y: number; width: number; height: number },
    textureDimension: { width: number; height: number },
    flipped: boolean
  ): void {
    this._server.publishFrameTexture(data, textureTarget, imageRegion, textureDimension, flipped);
  }
  */
  get name() {
    return this._server.name;
  }
  get serverDescription() {
    return this._server.serverDescription;
  }
  get hasClients() {
    return this._server.hasClients;
  }
}
class SyphonOpenGLClient {
  constructor(description) {
    __publicField(this, "_client");
    __publicField(this, "_onFrameListeners");
    __publicField(this, "_frameInterval");
    this._client = new SyphonAddon.OpenGLClient(description);
    this._onFrameListeners = [];
  }
  dispose() {
    if (this._frameInterval) {
      clearInterval(this._frameInterval);
    }
    this._onFrameListeners.length = 0;
    this._client.dispose();
  }
  on(channel, callback) {
    switch (channel) {
      case "frame": {
        if (!this._frameInterval) {
          this._frameInterval = setInterval(async () => {
            for (const fn of this._onFrameListeners) {
              const frame = await this._client.newFrame();
              fn(frame);
            }
          }, 1e3 / 60);
        }
        this._onFrameListeners.push(callback);
      }
    }
  }
  off(channel, callback) {
    switch (channel) {
      case "frame": {
        const listener = this._onFrameListeners.find((listener2) => listener2 === callback);
        if (listener) {
          const index = this._onFrameListeners.indexOf(listener);
          this._onFrameListeners.splice(index, 1);
        }
        if (this._onFrameListeners.length === 0) {
          clearInterval(this._frameInterval);
        }
      }
    }
  }
  get newFrame() {
    return this._client.newFrame();
  }
  get width() {
    return this._client.width;
  }
  get height() {
    return this._client.height;
  }
}
class SyphonMetalServer {
  constructor(name) {
    __publicField(this, "_server");
    this._server = new SyphonAddon.MetalServer(name);
  }
  dispose() {
    this._server.dispose();
  }
  publishImageData(data, imageRegion, bytesPerRow, flipped) {
    this._server.publishImageData(data, imageRegion, bytesPerRow, flipped);
  }
  get name() {
    return this._server.name;
  }
  get serverDescription() {
    return this._server.serverDescription;
  }
  get hasClients() {
    return this._server.hasClients;
  }
}
const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMAND = `node ${join(__dirname, "server-directory-process.js")}`;
const EXIT_TYPES = [
  `exit`,
  `SIGINT`,
  `SIGUSR1`,
  `SIGUSR2`,
  `SIGQUIT`,
  `SIGSEGV`,
  `uncaughtException`,
  `SIGTERM`
];
var SyphonServerDirectoryListenerChannel = /* @__PURE__ */ ((SyphonServerDirectoryListenerChannel2) => {
  SyphonServerDirectoryListenerChannel2["SyphonServerInfoNotification"] = "syphon:server.info";
  SyphonServerDirectoryListenerChannel2["SyphonServerErrorNotification"] = "syphon:server.error";
  SyphonServerDirectoryListenerChannel2["SyphonServerAnnounceNotification"] = "syphon:server.announce";
  SyphonServerDirectoryListenerChannel2["SyphonServerRetireNotification"] = "syphon:server.retire";
  SyphonServerDirectoryListenerChannel2["SyphonServerUpdateNotification"] = "syphon:server.update";
  return SyphonServerDirectoryListenerChannel2;
})(SyphonServerDirectoryListenerChannel || {});
const NodeSyphonMessageTypeKey = "NodeSyphonMessageType";
const NodeSyphonMessageKey = "NodeSyphonMessage";
const NodeSyphonMessageTypeInfo = "NodeSyphonMessageInfo";
const NodeSyphonMessageTypeError = "NodeSyphonMessageError";
const NodeSyphonMessageTypeNotification = "NodeSyphonMessageNotification";
const NodeSyphonNotificationTypeKey = "NodeSyphonNotificationType";
const NodeSyphonServerDictionaryKey = "NodeSyphonServerDictionary";
const _SyphonServerDirectory = class _SyphonServerDirectory {
  constructor() {
    __publicField(this, "_serverDirectoryProcess");
    __publicField(this, "_serverDirectoryRunning", false);
    /**
     * Current servers in directory.
     */
    __publicField(this, "_servers", []);
    /**
     * Listeners on servers' notifications.
     */
    __publicField(this, "_listeners", {});
    if (_SyphonServerDirectory._instance) {
      return _SyphonServerDirectory._instance;
    }
    _SyphonServerDirectory._instance = this;
  }
  dispose() {
    this.removeAllListeners();
    if (this._serverDirectoryProcess) {
      this._serverDirectoryProcess.kill();
      this._serverDirectoryProcess = null;
      this._servers.length = 0;
      this._serverDirectoryRunning = false;
    }
  }
  on(channel, fn) {
    if (!this._listeners[channel]) {
      this._listeners[channel] = [];
    }
    this._listeners[channel].push(fn);
  }
  off(channel, fn) {
    if (this._listeners[channel]) {
      const callback = this._listeners[channel].find((listener) => listener == fn);
      if (callback) {
        const index = this._listeners[channel].indexOf(callback);
        this._listeners[channel].splice(index, 1);
      }
    }
  }
  removeAllListeners() {
    for (const channel in this._listeners) {
      this._listeners[channel].length = 0;
    }
  }
  get isRunning() {
    return this._serverDirectoryRunning;
  }
  get servers() {
    return this._servers;
  }
  /**
   * Listens to servers' directory changes.
   */
  listen() {
    try {
      if (this._serverDirectoryRunning) {
        return;
      }
      this._handleExit();
      this._serverDirectoryProcess = exec(COMMAND);
      this._emit(
        "syphon:server.info",
        `Syphon directory server process launched with pid: ${this._serverDirectoryProcess.pid}`
      );
      this._serverDirectoryProcess.stdout.setEncoding("utf8");
      this._serverDirectoryProcess.stdout.on("data", this._parseProcessData.bind(this));
      this._serverDirectoryRunning = true;
    } catch (err) {
      this._emit("syphon:server.error", err);
      this.dispose();
      throw err;
    }
  }
  _emit(channel, value) {
    if (this._listeners[channel]) {
      for (const callback of this._listeners[channel]) {
        callback(value);
      }
    }
  }
  _parseProcessData(data) {
    try {
      const split = data.toString().split("--__node-syphon-delimiter__--");
      let obj = [];
      for (const str of split) {
        if (str.trim().length === 0)
          continue;
        obj.push(JSON.parse(str));
      }
      for (const message of obj) {
        switch (message.NodeSyphonMessageType) {
          case NodeSyphonMessageTypeInfo: {
            this._emit(
              "syphon:server.info",
              message.NodeSyphonMessage
            );
            break;
          }
          case NodeSyphonMessageTypeError: {
            this._emit(
              "syphon:server.error",
              message.NodeSyphonMessage
            );
            break;
          }
          case NodeSyphonMessageTypeNotification: {
            const type = message.NodeSyphonMessage.NodeSyphonNotificationType;
            switch (type) {
              case "SyphonServerAnnounceNotification": {
                this._servers.push(message.NodeSyphonMessage.NodeSyphonServerDictionary);
                this._servers = Array.from(new Set(this._servers));
                this._emit(
                  "syphon:server.announce",
                  message.NodeSyphonMessage.NodeSyphonServerDictionary
                );
                break;
              }
              case "SyphonServerRetireNotification": {
                const server = this._servers.find(
                  (s) => s.SyphonServerDescriptionUUIDKey == message.NodeSyphonMessage.NodeSyphonServerDictionary.SyphonServerDescriptionUUIDKey
                );
                if (server) {
                  const index = this._servers.indexOf(server);
                  this._servers.splice(index, 1);
                  this._emit(
                    "syphon:server.retire",
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                  );
                }
                break;
              }
              case "SyphonServerUpdateNotification": {
                const server = this._servers.find(
                  (s) => s.SyphonServerDescriptionUUIDKey == message.NodeSyphonMessage.NodeSyphonServerDictionary.SyphonServerDescriptionUUIDKey
                );
                if (server) {
                  const index = this._servers.indexOf(server);
                  this._servers.splice(
                    index,
                    1,
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                  );
                  this._emit(
                    "syphon:server.update",
                    message.NodeSyphonMessage.NodeSyphonServerDictionary
                  );
                }
                break;
              }
            }
            break;
          }
          default: {
            throw new Error(
              `Unhandled message type from ServerDirectory subprocess: ${message.NodeSyphonMessageType}`
            );
          }
        }
      }
    } catch (err) {
      throw err;
    }
  }
  _handleExit() {
    process.stdin.resume();
    EXIT_TYPES.forEach((eventType) => {
      const end = () => {
        if (this._serverDirectoryProcess) {
          this.dispose();
          EXIT_TYPES.forEach((eventType2) => {
            process.off(eventType2, end);
          });
        }
      };
      process.on(eventType, end);
    });
  }
};
__publicField(_SyphonServerDirectory, "_instance");
let SyphonServerDirectory = _SyphonServerDirectory;
export {
  NodeSyphonMessageKey,
  NodeSyphonMessageTypeError,
  NodeSyphonMessageTypeInfo,
  NodeSyphonMessageTypeKey,
  NodeSyphonMessageTypeNotification,
  NodeSyphonNotificationTypeKey,
  NodeSyphonServerDictionaryKey,
  SyphonMetalServer,
  SyphonOpenGLClient,
  SyphonOpenGLServer,
  SyphonServerDirectory,
  SyphonServerDirectoryListenerChannel
};
