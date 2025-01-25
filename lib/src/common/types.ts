export type SyphonServerDescriptionNameKey = 'SyphonServerDescriptionNameKey';
export type SyphonServerDescriptionAppNameKey = 'SyphonServerDescriptionAppNameKey';
export type SyphonServerDescriptionUUIDKey = 'SyphonServerDescriptionUUIDKey';

export type SyphonServerDescriptionPropertyKey =
  | SyphonServerDescriptionNameKey
  | SyphonServerDescriptionAppNameKey
  | SyphonServerDescriptionUUIDKey;

export type SyphonServerDescription = Record<SyphonServerDescriptionPropertyKey, string>;
