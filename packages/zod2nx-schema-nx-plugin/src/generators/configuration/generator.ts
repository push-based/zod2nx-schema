import {
  type Tree,
  formatFiles,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import type { ConfigGeneratorOptions } from './schema.js';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigGeneratorOptions,
) {
  readProjectConfiguration(tree, options.project);

  const { skipConfig, skipFormat } = options;

  if (skipConfig === true) {
    logger.info('Skip config file creation');
  } else {
    tree.write('zod2nx-schema.config.ts', 'export default [];\n');
  }

  if (skipFormat === true) {
    logger.info('Skip formatting files');
  } else {
    await formatFiles(tree);
  }
}

export default configurationGenerator;
