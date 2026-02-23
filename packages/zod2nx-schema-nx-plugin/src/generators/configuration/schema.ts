import { z } from 'zod';

export const configGeneratorOptionsSchema = z.object({
  project: z.string().meta({
    describe: 'The name of the project.',
    prompt: 'Which project should configure Zod2NxSchema?',
    dropdown: 'projects',
    default: {
      source: 'argv',
      index: 0,
    },
  }),

  bin: z
    .string()
    .meta({
      describe: 'Path to Zod2NxSchema CLI',
    })
    .optional(),

  skipConfig: z.boolean().meta({
    describe: 'Skip adding the zod2nx-schema.config.ts to the project root.',
    default: false,
  }),

  skipFormat: z.boolean().meta({
    describe: 'Skip formatting of changed files',
    default: false,
  }),

  registerSyncGenerator: z.boolean().meta({
    describe: 'Register the sync generator for a specific task',
    default: false,
  }),

  taskName: z
    .string()
    .meta({
      describe:
        'The task name to register the sync generator for (e.g., build, lint)',
    })
    .optional(),
});

export type ConfigGeneratorOptions = z.infer<
  typeof configGeneratorOptionsSchema
>;

export default configGeneratorOptionsSchema;
