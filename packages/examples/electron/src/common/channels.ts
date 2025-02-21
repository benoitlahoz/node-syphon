export enum ServerDirectoryChannels {
  GetServers = 'directory:servers.get',
}

export enum MetalDataChannels {
  OpenServerWindow = 'open-metal-data-server-window',
  ConnectServer = 'connect-metal-data-server',
  PullFrame = 'pull-metal-data',
  CreateServer = 'create-metal-data-server',
  DestroyServer = 'destroy-metal-data-server',
  PublishFrame = 'publish-metal-data',
}

export enum OpenGLDataChannels {
  OpenServerWindow = 'open-gl-data-server-window',
  ConnectServer = 'connect-gl-data-server',
  PullFrame = 'pull-gl-data',
  CreateServer = 'create-gl-data-server',
  DestroyServer = 'destroy-gl-data-server',
  PublishFrame = 'publish-gl-data',
}
