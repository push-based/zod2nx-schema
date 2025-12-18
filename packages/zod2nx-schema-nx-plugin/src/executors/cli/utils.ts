import type { CliCommandExecutorOptions } from './schema.js';

export function parseCliExecutorOptions(
  options: Partial<CliCommandExecutorOptions>,
): CliCommandExecutorOptions {
  return {
    verbose: options.verbose ?? false,
    dryRun: options.dryRun ?? false,
    ...(options.bin && { bin: options.bin }),
    ...(options.command && { command: options.command }),
    ...(options.config && { config: options.config }),
  };
}
