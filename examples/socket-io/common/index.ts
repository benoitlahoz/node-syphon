export enum Messages {
  // Notifications.

  ServerAnnounced = 'syphon:server.announced',
  ServerRetired = 'syphon:server.retired',
  ServerUpdated = 'syphon:server.updated',

  // Servers.
  GetAllServers = 'syphon:servers.get.all',
  AllServers = 'syphon:server.all',

  SubscribeToServer = 'syphon:server.subscribe',
  UnsubscribeFromServer = 'syphon:server.unsubscribe',
  ServerPublishedFrame = 'syphon:server.published.frame',
}
