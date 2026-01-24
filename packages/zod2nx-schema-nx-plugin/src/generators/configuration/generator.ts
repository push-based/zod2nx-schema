import {
  type ProjectConfiguration,
  type Tree,
  formatFiles,
  logger,
  readProjectConfiguration,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit';
import { ZOD2NX_SCHEMA_CONFIG_NAME } from '@push-based/zod2nx-schema';
import * as path from 'node:path';
import { PACKAGE_NAME } from '../../internal/constants.js';
import type { ConfigGeneratorOptions } from './schema.js';

const CONFIG_FILE_NAME = `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`;

// eslint-disable-next-line max-lines-per-function
export function registerSyncGeneratorLocallyFn(
  tree: Tree,
  projectConfig: ProjectConfiguration,
  taskName?: string,
) {
  const syncGeneratorName = `${PACKAGE_NAME}:sync-schemas`;

  if (!taskName) {
    logger.warn(
      'Task name is required when registering sync generator locally',
    );
    return;
  }

  // Check if project has project.json or uses inferred targets
  const projectJsonPath = path.join(projectConfig.root, 'project.json');

  if (tree.exists(projectJsonPath)) {
    updateProjectConfiguration(tree, projectConfig.name ?? '', {
      ...projectConfig,
      targets: {
        ...projectConfig.targets,
        [taskName]: {
          ...projectConfig.targets?.[taskName],
          syncGenerators: [
            ...(projectConfig.targets?.[taskName]?.syncGenerators || []),
            syncGeneratorName,
          ].filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
        },
      },
    });
  } else {
    const packageJsonPath = path.join(projectConfig.root, 'package.json');
    if (tree.exists(packageJsonPath)) {
      updateJson(
        tree,
        packageJsonPath,
        (packageJson: Record<string, unknown>) => {
          const nx = (packageJson.nx as Record<string, unknown>) || {};
          const targets =
            (nx.targets as Record<string, Record<string, unknown>>) || {};
          const currentTarget =
            (targets[taskName] as Record<string, unknown>) || {};
          const currentSyncGenerators =
            (currentTarget.syncGenerators as string[]) || [];

          return {
            ...packageJson,
            nx: {
              ...nx,
              targets: {
                ...targets,
                [taskName]: {
                  ...currentTarget,
                  syncGenerators: [
                    ...currentSyncGenerators,
                    syncGeneratorName,
                  ].filter(
                    (value, index, self) => self.indexOf(value) === index,
                  ), // Remove duplicates
                },
              },
            },
          };
        },
      );
    } else {
      logger.warn(
        `Neither project.json nor package.json found in ${projectConfig.root}`,
      );
    }
  }
}

export async function configurationGenerator(
  tree: Tree,
  options: ConfigGeneratorOptions,
) {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectRoot = projectConfig.root;

  const { skipConfig, skipFormat, registerSyncGenerator, taskName } = options;

  if (skipConfig === true) {
    logger.info('Skip config file creation');
  } else {
    const configPath = path.join(projectRoot, CONFIG_FILE_NAME);

    if (tree.exists(configPath)) {
      logger.warn(
        `NOTE: No config file created as ${CONFIG_FILE_NAME} file already exists.`,
      );
    } else {
      tree.write(configPath, 'export default [];\n');
    }
  }

  if (registerSyncGenerator) {
    registerSyncGeneratorLocallyFn(tree, projectConfig, taskName);
  }

  if (skipFormat === true) {
    logger.info('Skip formatting files');
  } else {
    await formatFiles(tree);
  }
}

export default configurationGenerator;
