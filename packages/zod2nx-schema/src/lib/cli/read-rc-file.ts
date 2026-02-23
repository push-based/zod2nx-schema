import ansis from 'ansis';
import path from 'node:path';
import { z } from 'zod';
import { generateZod2NxSchemaOptionsSchema } from '../schema/generate-schema.js';
import { fileExists, importModule } from '../utils/file-system.js';
import { logger } from '../utils/logger.js';
import { validate } from '../utils/validate.js';
import {
  SUPPORTED_CONFIG_FILE_FORMATS,
  ZOD2NX_SCHEMA_CONFIG_NAME,
} from './constant.js';

export const zod2NxSchemaConfigSchema = z.array(
  generateZod2NxSchemaOptionsSchema,
);

export type Zod2NxSchemaConfig = z.infer<typeof zod2NxSchemaConfigSchema>;

export async function readRcByPath(
  filePath: string,
  tsconfig?: string,
): Promise<Zod2NxSchemaConfig> {
  const formattedTarget = [
    `${ansis.bold(path.relative(process.cwd(), filePath))}`,
    tsconfig &&
      `(paths from ${ansis.bold(path.relative(process.cwd(), tsconfig))})`,
  ]
    .filter(Boolean)
    .join(' ');

  // eslint-disable-next-line functional/no-let
  let result;
  await logger.task(`Importing config from ${formattedTarget}`, async () => {
    result = await importModule({
      filepath: filePath,
      tsconfig,
      format: 'esm',
    });
    return `Imported config from ${formattedTarget}`;
  });

  const config = validate(zod2NxSchemaConfigSchema, result, { filePath });
  logger.info('Configuration is valid ✓');
  return config;
}

export async function autoloadRc(
  tsconfig?: string,
): Promise<Zod2NxSchemaConfig> {
  const configFilePatterns = [
    ZOD2NX_SCHEMA_CONFIG_NAME,
    `{${SUPPORTED_CONFIG_FILE_FORMATS.join(',')}}`,
  ].join('.');

  logger.debug(`Looking for default config file ${configFilePatterns}`);

  // eslint-disable-next-line functional/no-let
  let ext = '';
  // eslint-disable-next-line functional/no-loop-statements
  for (const extension of SUPPORTED_CONFIG_FILE_FORMATS) {
    const filePath = `${ZOD2NX_SCHEMA_CONFIG_NAME}.${extension}`;
    const exists = await fileExists(filePath);

    if (exists) {
      logger.debug(`Found default config file ${ansis.bold(filePath)}`);
      ext = extension;
      break;
    }
  }

  if (!ext) {
    logger.warn(`No ${configFilePatterns} file present in ${process.cwd()}`);
    return [];
  }

  return readRcByPath(
    path.join(process.cwd(), `${ZOD2NX_SCHEMA_CONFIG_NAME}.${ext}`),
    tsconfig,
  );
}
