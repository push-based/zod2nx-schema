import { type ExecutorContext, logger } from '@nx/devkit';
import { executeProcess } from '@push-based/zod2nx-schema';
import type { CliCommandExecutorOptions } from './schema.js';

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

function flattenOptions(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value == null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.map(item => `--${fullKey}="${item}"`);
    }

    if (typeof value === 'object') {
      return flattenOptions(value as Record<string, unknown>, fullKey);
    }

    return [`--${fullKey}="${value}"`];
  });
}

export default async function runCliExecutor(
  options: CliCommandExecutorOptions & Record<string, unknown>,
  context: ExecutorContext,
): Promise<ExecutorOutput> {
  const { dryRun, verbose, command: cliCommand, bin, ...restOptions } = options;
  const command = bin ? 'node' : 'npx';
  const cliPackage = bin ?? '@push-based/zod2nx-schema';

  const baseArgs = [
    cliPackage,
    context.projectName,
    ...(cliCommand ? [cliCommand] : []),
  ];
  const optionArgs = flattenOptions(restOptions);
  const verboseArgs = verbose ? ['--verbose'] : [];

  const args = [...baseArgs, ...optionArgs, ...verboseArgs];
  const commandString = [command, ...args].join(' ');

  if (verbose) {
    logger.info(`Run CLI executor: ${commandString}`);
  }

  if (dryRun) {
    logger.warn(`DryRun execution of: ${commandString}`);
    return { success: true, command: commandString };
  }

  try {
    if (verbose) {
      logger.info(`Command: ${commandString}`);
    }

    await executeProcess({
      command,
      // @TODO use objectToCliArgs
      args: args.filter((arg): arg is string => arg !== undefined),
      cwd: context.cwd,
    });

    return { success: true, command: commandString };
  } catch (error) {
    return {
      success: false,
      command: commandString,
      error: error instanceof Error ? error : new Error(`${error}`),
    };
  }
}
