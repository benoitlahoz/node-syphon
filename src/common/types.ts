export const SyphonServerDescriptionNameKey = 'SyphonServerDescriptionNameKey';
export const SyphonServerDescriptionAppNameKey = 'SyphonServerDescriptionAppNameKey';
export const SyphonServerDescriptionUUIDKey = 'SyphonServerDescriptionUUIDKey';

export type SyphonServerDescriptionPropertyKey =
  | typeof SyphonServerDescriptionNameKey
  | typeof SyphonServerDescriptionAppNameKey
  | typeof SyphonServerDescriptionUUIDKey;

export type SyphonServerDescription = Record<SyphonServerDescriptionPropertyKey, string>;
