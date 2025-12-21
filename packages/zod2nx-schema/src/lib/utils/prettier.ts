import ansis from 'ansis';
import path from 'node:path';
import { ProcessError, executeProcess } from './execute-process.js';
import { fileExists } from './file-system.js';
import { logger } from './logger.js';

/**
 * Prettier configuration file names in order of priority.
 * @see https://prettier.io/docs/en/configuration.html
 */
export const PRETTIER_CONFIG_FILES = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  '.prettierrc.json5',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  '.prettierrc.ts',
  '.prettierrc.mts',
  '.prettierrc.cts',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
  'prettier.config.ts',
  'prettier.config.mts',
  'prettier.config.cts',
] as const;

export type PrettierConfigFile = (typeof PRETTIER_CONFIG_FILES)[number];

/**
 * Result of prettier detection.
 */
export type PrettierDetectionResult = {
  /** Path to the detected prettier config file, if any. */
  configPath: string | undefined;
  /** Whether prettier CLI is available. */
  isAvailable: boolean;
};

/**
 * Options for prettier detection.
 */
export type DetectPrettierOptions = {
  /** Working directory to search for config files. Defaults to `process.cwd()`. */
  cwd?: string;
};

/**
 * Options for formatting files with prettier.
 */
export type FormatWithPrettierOptions = {
  /** Working directory for prettier execution. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Suppress logging output. */
  silent?: boolean;
};

/**
 * Detects if prettier is available and finds the config file.
 *
 * @param options - Detection options.
 * @returns Detection result with config path and availability status.
 *
 * @example
 * const { configPath, isAvailable } = await detectPrettier();
 * if (isAvailable) {
 *   console.log('Prettier is available');
 *   if (configPath) {
 *     console.log(`Config found at: ${configPath}`);
 *   }
 * }
 */
export async function detectPrettier(
  options?: DetectPrettierOptions,
): Promise<PrettierDetectionResult> {
  const cwd = options?.cwd ?? process.cwd();

  logger.debug(
    `Detecting prettier in ${ansis.bold(path.relative(process.cwd(), cwd) || '.')}`,
  );

  const [configPath, isAvailable] = await Promise.all([
    findPrettierConfig(cwd),
    isPrettierAvailable(cwd),
  ]);

  if (isAvailable) {
    logger.debug(
      configPath
        ? `Prettier available with config ${ansis.bold(path.relative(process.cwd(), configPath))}`
        : 'Prettier available without local config',
    );
  } else {
    logger.debug('Prettier not available');
  }

  return { configPath, isAvailable };
}

/**
 * Searches for a prettier configuration file in the given directory.
 *
 * @param cwd - Directory to search in.
 * @returns Path to the config file if found, undefined otherwise.
 */
export async function findPrettierConfig(
  cwd: string = process.cwd(),
): Promise<string | undefined> {
  const configFilePatterns = `{${PRETTIER_CONFIG_FILES[0]},${PRETTIER_CONFIG_FILES[1]},…}`;
  logger.debug(`Looking for prettier config file ${configFilePatterns}`);

  // eslint-disable-next-line functional/no-loop-statements
  for (const configFile of PRETTIER_CONFIG_FILES) {
    const configPath = path.join(cwd, configFile);
    if (await fileExists(configPath)) {
      logger.debug(`Found prettier config ${ansis.bold(configFile)}`);
      return configPath;
    }
  }

  // Check package.json for "prettier" key
  const packageJsonPath = path.join(cwd, 'package.json');
  if (await fileExists(packageJsonPath)) {
    try {
      const { readTextFile } = await import('./file-system.js');
      const packageJson = JSON.parse(await readTextFile(packageJsonPath));
      if ('prettier' in packageJson) {
        logger.debug(`Found prettier config in ${ansis.bold('package.json')}`);
        return packageJsonPath;
      }
    } catch {
      // Ignore parse errors
    }
  }

  logger.debug('No prettier config file found');
  return undefined;
}

/**
 * Checks if prettier CLI is available by running `npx prettier --version`.
 *
 * @param cwd - Working directory for the check.
 * @returns True if prettier is available, false otherwise.
 */
export async function isPrettierAvailable(
  cwd: string = process.cwd(),
): Promise<boolean> {
  try {
    const result = await executeProcess({
      command: 'npx',
      args: ['prettier', '--version'],
      cwd,
      silent: true,
    });
    return result.code === 0;
  } catch {
    return false;
  }
}

/**
 * Formats files using prettier.
 *
 * @param filePaths - Array of file paths to format.
 * @param options - Formatting options.
 * @returns Promise that resolves when formatting is complete.
 * @throws {ProcessError} If prettier execution fails and files couldn't be formatted.
 *
 * @example
 * await formatWithPrettier(['src/schema.json', 'src/executor-schema.json']);
 */
export async function formatWithPrettier(
  filePaths: string[],
  options?: FormatWithPrettierOptions,
): Promise<void> {
  if (filePaths.length === 0) {
    return;
  }

  const { cwd = process.cwd(), silent = false } = options ?? {};
  const fileCount = filePaths.length;
  const fileLabel = fileCount === 1 ? 'file' : 'files';
  const formattedFiles = filePaths
    .map(f => ansis.bold(path.relative(process.cwd(), f)))
    .join(', ');

  const runPrettier = async () =>
    executeProcess({
      command: 'npx',
      args: ['prettier', '--write', ...filePaths],
      cwd,
      silent: true,
    });

  try {
    await (silent
      ? runPrettier()
      : logger.task(
          `Formatting ${fileCount} ${fileLabel} with prettier`,
          async () => {
            await runPrettier();
            return `Formatted ${formattedFiles}`;
          },
        ));
  } catch (error) {
    if (error instanceof ProcessError) {
      logger.warn(`Prettier formatting failed: ${error.message}`);
      logger.debug(`Prettier stderr: ${error.stderr}`);
    }
    throw error;
  }
}

/**
 * Attempts to format files with prettier if available, fails silently if not.
 *
 * This is a safe wrapper around `formatWithPrettier` that won't throw
 * if prettier is not available or fails.
 *
 * @param filePaths - Array of file paths to format.
 * @param options - Formatting options.
 * @returns Promise that resolves to true if formatting succeeded, false otherwise.
 *
 * @example
 * const formatted = await tryFormatWithPrettier(['schema.json']);
 * if (!formatted) {
 *   console.log('Files were not formatted');
 * }
 */
export async function tryFormatWithPrettier(
  filePaths: string[],
  options?: FormatWithPrettierOptions,
): Promise<boolean> {
  if (filePaths.length === 0) {
    return true;
  }

  const { cwd = process.cwd(), silent = false } = options ?? {};

  const { isAvailable } = await detectPrettier({ cwd });

  if (!isAvailable) {
    if (!silent) {
      logger.warn('Prettier not found, skipping formatting');
    }
    return false;
  }

  try {
    await formatWithPrettier(filePaths, options);
    return true;
  } catch (error) {
    if (!silent) {
      logger.warn(
        `Could not format files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
    return false;
  }
}
