import bindings from 'bindings';

// Get node addon.

export const SyphonAddon = bindings({
  bindings: 'syphon',
  // The bin folder from the lib one.
  try: [
    // For standard installation.
    ['module_root', 'node_modules', 'node-syphon', 'dist', 'bin', 'syphon.node'],
    // For local examples.
    ['module_root', 'dist', 'bin', 'syphon.node'],
  ],
});
