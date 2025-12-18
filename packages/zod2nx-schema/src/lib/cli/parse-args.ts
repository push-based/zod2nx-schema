import { parseArgs } from 'node:util';
import { z } from 'zod';
import {
  exportNameSchema,
  outPathSchema,
  schemaSchema,
} from '../schema/generate-schema.js';
import { stringifyError } from '../utils/errors.js';

export const commandSchema = z.enum(['convert', 'print-config', 'help']).meta({
  describe: "The command to run (e.g., 'convert')",
});
export const fromPkgSchema = z.string().meta({
  describe: 'Path to package.json of the Nx plugin for auto deriving schemas',
});

export const cliArgsSchema = z
  .object({
    // cli options options
    command: commandSchema.optional(),
    fromPkg: fromPkgSchema.optional(),
    config: z.string().optional().meta({
      describe:
        'Path to a configuration file (if not provided, e.g. zod2nx-schema.config.ts)',
    }),
    tsconfig: z.string().optional().meta({
      describe:
        'Path to a TypaScript configuration file used to resolve config files',
    }),
    // output only used for the print-config command
    output: z.string().optional().meta({
      describe:
        'Output path for print-config command (if not provided, prints to stdout)',
    }),
    // generate options
    schema: schemaSchema.optional(),
    outPath: outPathSchema.optional(),
    exportName: exportNameSchema.optional(),
  })
  .meta({
    describe:
      'Zod schema for CLI arguments validation. Validates and transforms command line arguments for the zod2nx-schema tool. Supports both positional and named arguments with sensible defaults.',
  });

export type CliArgs = z.infer<typeof cliArgsSchema>;

export function parseCliArgs(argv = process.argv.slice(2)): CliArgs {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      // named options
      fromPkg: { type: 'string' },
      config: { type: 'string' },
      tsconfig: { type: 'string' },
      output: { type: 'string' },

      exportName: { type: 'string' },

      help: { type: 'boolean', short: 'h' },
    },
  });

  const parsedPositionals = parsePositionals(positionals, values.help === true);

  try {
    return cliArgsSchema.parse({
      ...values,
      ...parsedPositionals,
    });
  } catch (error) {
    throw new Error(`Error parsing CLI arguments: ${stringifyError(error)}`);
  }
}

export function parsePositionals(positionals: string[], isHelp: boolean) {
  try {
    const [command, schema, outPath] =
      isHelp || commandSchema.safeParse(positionals.at(0)).success
        ? positionals
        : ['convert', ...positionals];
    return {
      command,
      ...(schema ? { schema } : {}),
      ...(outPath ? { outPath } : {}),
    };
  } catch (error) {
    throw new Error(
      `Error parsing positional arguments: ${stringifyError(error)}`,
    );
  }
}
