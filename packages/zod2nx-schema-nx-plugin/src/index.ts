import { createNodes, createNodesV2 } from './plugin/index.js';

// default export for nx.json#plugins
const plugin = {
  name: '@push-based/nx-plugin',
  createNodesV2,
  // Keep for backwards compatibility with Nx < 21
  createNodes,
};

export default plugin;

export type { CliCommandExecutorOptions } from './executors/cli/schema.js';
export { createNodes, createNodesV2 } from './plugin/index.js';
