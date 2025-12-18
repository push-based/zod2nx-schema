import { cliArgsSchema } from '@push-based/zod2nx-schema';
import { z } from 'zod';

export const cliExecutorOnlyOptionsSchema = z.object({
  verbose: z.boolean().optional().meta({ describe: 'Print additional logs' }),
  dryRun: z.boolean().optional().meta({
    describe:
      "Print the commands that would be run, but don't actually run them",
  }),
  bin: z.string().optional().meta({ describe: 'Path to CLI binary' }),
});

export const cliExecutorOptionsSchema = cliExecutorOnlyOptionsSchema.extend(
  cliArgsSchema.shape,
);

export type CliCommandExecutorOptions = z.infer<
  typeof cliExecutorOptionsSchema
>;

export default cliExecutorOptionsSchema;
