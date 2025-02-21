export class ServerNotExistError extends Error {
  constructor(uuid: string) {
    super();
    this.message = `No server to connect with uuid '${uuid}'.`;
  }
}

export class DisconnectedClientFrameError extends Error {
  constructor() {
    super();
    this.message = `Trying to get a frame from a client that is not connected.`;
  }
}

export class NotSameServerError extends Error {
  constructor() {
    super();
    this.message = `Connected server is not the same as the one from which a frame is requested.`;
  }
}
