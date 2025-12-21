import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { CliArgs } from '../cli/parse-args.js';
import { logger } from '../utils/logger.js';
import {
  deriveOutputPath,
  loadModuleExport,
  toPascalCaseSchemaName,
} from '../utils/transform.js';
import {
  additionalPropertiesSchema,
  descriptionSchema,
  includeCommandDefaultSchema,
  nameSchema, type NxJSONSchema,
  titleSchema,
} from './nx.schema.js';
import {
  type Zod2NxSchemaOptions,
  zod2NxSchemaOptionsSchema,
  zod2nxSchema,
} from './zod2nx-schema.js';

export const schemaSchema = z
  .string()
  .describe('Path to the module exporting the Zod schema');
export const exportNameSchema = z
  .string()
  .describe('Name of the export in the module (default: "default")');
export const outPathSchema = z
  .string()
  .describe('Path to output the generated JSON schema file');

export const generateFileOptionsSchema = z.object({
  schema: schemaSchema,
  exportName: exportNameSchema.optional(),
  outPath: outPathSchema.optional(),
});
export type GenerateFileOptions = z.infer<typeof generateFileOptionsSchema>;

export const generateZod2NxSchemaOptionsSchema = z
  .object({
    options: zod2NxSchemaOptionsSchema,
  })
  .extend(generateFileOptionsSchema.shape);
export type GenerateZod2NxSchemaOptions = z.infer<
  typeof generateZod2NxSchemaOptionsSchema
>;

export const parsedGenerateZod2NxSchemaOptionsSchema = z.object({
  schema: schemaSchema,
  exportName: exportNameSchema,
  outPath: outPathSchema,
  options: z.object({
    name: nameSchema,
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    includeCommandDefault: includeCommandDefaultSchema.optional(),
    additionalProperties: additionalPropertiesSchema.optional(),
  }),
});
export type ParsedGenerateZod2NxSchemaOptions = z.infer<
  typeof parsedGenerateZod2NxSchemaOptionsSchema
>;

export function parseGenerateSchema(
  generateOptions: GenerateFileOptions & {
    options: Partial<Zod2NxSchemaOptions>;
  },
): ParsedGenerateZod2NxSchemaOptions {
  const {
    exportName = 'default',
    outPath,
    schema,
    options,
    ...restGenerateOptions
  } = generateOptions;
  const { name, ...restSchemaOptions } = options;
  return parsedGenerateZod2NxSchemaOptionsSchema.parse({
    ...restGenerateOptions,
    outPath: outPath ?? deriveOutputPath(schema),
    schema,
    exportName,
    options: {
      ...restSchemaOptions,
      name: name ?? toPascalCaseSchemaName(exportName),
    },
  });
}

export function parseManyGenerateSchemaOptions(
  schemaOptionsArray: GenerateZod2NxSchemaOptions[],
  _cliArgs: CliArgs,
): ParsedGenerateZod2NxSchemaOptions[] {
  const result = schemaOptionsArray.map(parseGenerateSchema);

  const paths = result.map(opt => opt.outPath);
  const uniquePaths = new Set(paths);
  if (uniquePaths.size !== result.length) {
    throw new Error(
      `Invalid generateSchema options. outPath must be unique across all options. Found duplicates in: ${paths.join(', ')}`,
    );
  }
  return result;
}

export async function generateSchemaFile(
  opt: ParsedGenerateZod2NxSchemaOptions,
): Promise<void> {
  const {
    schema,
    exportName = 'default',
    outPath,
    options: schemaOptions,
  } = opt as ParsedGenerateZod2NxSchemaOptions;
  const outputFilePath = path.resolve(outPath);
  try {
    const zodSchema = await loadModuleExport<z.ZodTypeAny>(schema, exportName);
    const nxSchema = zod2nxSchema(zodSchema, {
      ...schemaOptions,
    });

    await writeFile(outputFilePath, JSON.stringify(nxSchema, null, 2), 'utf8');
    logger.info(
      `✅ Generated schema file: ${outputFilePath.replace(process.cwd(), '').slice(1)}`,
    );
  } catch (error) {
    logger.error(`❌ Error generating schema file: ${outputFilePath}`);
    throw error;
  }
}

export async function generateManySchemaFiles(
  generateSchemaArray: ParsedGenerateZod2NxSchemaOptions[],
): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(generateSchemaArray.map(generateSchemaFile));
}
