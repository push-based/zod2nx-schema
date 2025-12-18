import { type GenerateZod2NxSchemaOptions } from '@push-based/zod2nx-schema';

export default [
  {
    schema: 'src/schema.ts',
    outPath: 'src/config-file-schema.json',
    options: {
      name: 'ExampleSchemaFromConfig',
      title: 'Example Schema defined config file',
    },
  },
] satisfies GenerateZod2NxSchemaOptions[];
