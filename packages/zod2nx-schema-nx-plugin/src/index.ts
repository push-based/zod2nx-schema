import { createNodesV2 } from './plugin/index.js';

// default export for nx.json#plugins
const plugin = {
  name: '@push-based/nx-plugin',
  createNodesV2,
};

export default plugin;

export type { CliCommandExecutorOptions } from './executors/cli/schema.js';
export { createNodesV2 } from './plugin/index.js';
