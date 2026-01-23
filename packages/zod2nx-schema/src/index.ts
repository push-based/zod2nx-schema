export { importModule } from './lib/utils/file-system.js';

export { zod2nxSchema } from './lib/schema/zod2nx-schema.js';
export {
  generateSchemaFile,
  generateManySchemaFiles,
  type GenerateZod2NxSchemaOptions,
} from './lib/schema/generate-schema.js';

export { ZOD2NX_SCHEMA_CONFIG_NAME } from './lib/cli/constant.js';
export * from './lib/utils/execute-process.js';
export { logger } from './lib/utils/logger.js';
export { objectToCliArgs } from './lib/utils/transform.js';

export { runCli } from './lib/cli/cli.js';
export { type CliArgs, cliArgsSchema } from './lib/cli/parse-args.js';

export type { NxSchema } from './lib/schema/nx.schema.js';
