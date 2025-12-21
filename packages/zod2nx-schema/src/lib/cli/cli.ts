import {
  type GenerateZod2NxSchemaOptions,
  generateManySchemaFiles,
  parseGenerateSchema,
  parseManyGenerateSchemaOptions,
} from '../schema/generate-schema.js';
import { logger } from '../utils/logger.js';
import { groupByStatus } from '../utils/promises.js';
import { loadConfigFromPackageJson } from './derive-config.js';
import { helpCommand, isHelpCommand } from './help.command.js';
import { parseCliArgs } from './parse-args.js';
import {
  isPrintConfigCommand,
  printConfigCommand,
} from './print-config.command.js';
import { autoloadRc, readRcByPath } from './read-rc-file.js';

/* eslint-disable-next-line max-lines-per-function */
export async function runCli(): Promise<void> {
  const args = process.argv.slice(2);

  const {
    fromPkg,
    config: configPath,
    tsconfig,
    command,
    output,
    ...commandArgs
  } = parseCliArgs(args);

  if (isHelpCommand(args)) {
    helpCommand();
    return;
  }

  const derivedSchemaOptions = fromPkg
    ? await loadConfigFromPackageJson(fromPkg)
    : [];
  const configJson = await (configPath
    ? readRcByPath(configPath, tsconfig)
    : autoloadRc(tsconfig));

  const { schema, exportName, outPath, ...cliOptions } = commandArgs;
  const loadedConfigs: GenerateZod2NxSchemaOptions[] = [
    ...derivedSchemaOptions,
    ...configJson,
  ];

  const configFromCli = schema
    ? parseGenerateSchema({
        schema,
        exportName,
        outPath,
        options: cliOptions,
      })
    : undefined;

  const generateSchemaOptions = parseManyGenerateSchemaOptions(
    [
      ...loadedConfigs,
      ...(loadedConfigs.length === 0 && configFromCli ? [configFromCli] : []),
    ],
    commandArgs,
  );

  if (isPrintConfigCommand(args)) {
    await printConfigCommand(generateSchemaOptions, {
      configPath,
      output,
    });
    return;
  }
  logger.info(
    `Converting ${generateSchemaOptions.length} schema file${generateSchemaOptions.length === 1 ? '' : 's'}...`,
  );

  const { rejected } = groupByStatus(
    await generateManySchemaFiles(generateSchemaOptions),
  );
  if (rejected.length > 0) {
    throw new Error(rejected.map(f => f.reason).join('\n'));
  }
}
