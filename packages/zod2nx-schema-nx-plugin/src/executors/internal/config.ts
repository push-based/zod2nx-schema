import * as path from 'node:path';
import type { BaseNormalizedExecutorContext } from './types.js';

export function globalConfig(
  options: Record<string, unknown>,
  context: BaseNormalizedExecutorContext,
) {
  const { projectConfig } = context;
  const { root: projectRoot = '' } = projectConfig ?? {};
  const { verbose, config } = options;
  return {
    verbose: !!verbose,
    config: config ?? path.join(projectRoot, 'zod2nx-schema.config.ts'),
  };
}
