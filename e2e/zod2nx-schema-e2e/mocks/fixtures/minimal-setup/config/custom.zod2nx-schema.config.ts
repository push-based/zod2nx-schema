import { type GenerateZod2NxSchemaOptions } from '@push-based/zod2nx-schema';
import * as path from 'node:path';

export default [
  {
    schema: path.join('__test__', 'convert', 'src', 'schema.ts'),
    outPath: path.join('__test__', 'convert', 'src', 'config-file-schema.json'),
    options: {
      name: 'ExampleSchemaFromConfig',
      title: 'Example Schema defined config file',
    },
  },
] satisfies GenerateZod2NxSchemaOptions[];
