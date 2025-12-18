import type { TargetConfiguration } from '@nx/devkit';
import type { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { PACKAGE_NAME } from '../../internal/constants.js';

export async function createConfigurationTarget(options?: {
  projectName?: string;
}): Promise<TargetConfiguration<RunCommandsOptions>> {
  const { projectName } = options ?? {};
  const projectArg = projectName ? ` --project="${projectName}"` : '';
  return {
    command: `nx g ${PACKAGE_NAME}:configuration${projectArg}`,
  };
}
