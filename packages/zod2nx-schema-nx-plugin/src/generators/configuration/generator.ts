import {
  type Tree,
  formatFiles,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import { ZOD2NX_SCHEMA_CONFIG_NAME } from '@push-based/zod2nx-schema';
import { join } from 'node:path';
import type { ConfigGeneratorOptions } from './schema.js';

const CONFIG_FILE_NAME = `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`;

export async function configurationGenerator(
  tree: Tree,
  options: ConfigGeneratorOptions,
) {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectRoot = projectConfig.root;

  const { skipConfig, skipFormat } = options;

  if (skipConfig === true) {
    logger.info('Skip config file creation');
  } else {
    const configPath = join(projectRoot, CONFIG_FILE_NAME);

    if (tree.exists(configPath)) {
      logger.warn(
        `NOTE: No config file created as ${CONFIG_FILE_NAME} file already exists.`,
      );
    } else {
      tree.write(configPath, 'export default [];\n');
    }
  }

  if (skipFormat === true) {
    logger.info('Skip formatting files');
  } else {
    await formatFiles(tree);
  }
}

export default configurationGenerator;
