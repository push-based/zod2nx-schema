import { stat } from 'node:fs/promises';
import { logger } from '../utils/logger.js';
import { ZOD2NX_SCHEMA_CONFIG_NAME } from './constant.js';

export async function findDefaultConfig(): Promise<string | undefined> {
  const extensions = ['ts', 'mjs', 'js'];

  /* eslint-disable-next-line functional/no-loop-statements */
  for (const ext of extensions) {
    const path = `${ZOD2NX_SCHEMA_CONFIG_NAME}.${ext}`;
    if (await fileExists(path)) {
      return path;
    } else {
      logger.error(`Not found ${path}`);
    }
  }

  return undefined;
}

function fileExists(path: string): Promise<boolean> {
  return stat(path)
    .then(stats => stats.isFile())
    .catch(() => false);
}
