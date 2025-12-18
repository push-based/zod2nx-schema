import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

/**
 * Context that is normalized for all executors
 */
export type BaseNormalizedExecutorContext = {
  projectConfig?: ProjectConfiguration;
  workspaceRoot: string;
};
