import { type GenerateZod2NxSchemaOptions } from '@push-based/zod2nx-schema';

export default [
  {
    schema: '__test__/convert/src/schema.ts',
    outPath: '__test__/convert/src/config-file-schema.json',
    options: {
      name: 'ExampleSchemaFromConfig',
      title: 'Example Schema defined config file',
    },
  },
] satisfies GenerateZod2NxSchemaOptions[];
