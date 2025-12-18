import { z } from 'zod';
import {
  type NxJSONSchema,
  type NxJSONSchemaDefinition,
  type NxSchema,
  additionalPropertiesSchema,
  descriptionSchema,
  includeCommandDefaultSchema,
  nameSchema,
  titleSchema,
} from './nx.schema.js';

/**
 * Helper to build schema properties with optional command default
 */
function buildSchemaProperties(
  baseProps: Record<string, NxJSONSchemaDefinition>,
  includeCommandDefault?: boolean,
): Record<string, NxJSONSchemaDefinition> {
  if (!includeCommandDefault) {
    return baseProps;
  }

  const command = baseProps['command'];
  if (!command || typeof command === 'boolean') {
    return baseProps;
  }

  return {
    ...baseProps,
    command: {
      ...command,
      $default: { $source: 'argv', index: 0 },
    },
  };
}

/**
 * Helper to build schema result object
 */
function buildSchemaResult(
  options: {
    rest: Omit<NxJSONSchema, 'properties'>;
    properties: Record<string, NxJSONSchemaDefinition>;
  } & Zod2NxSchemaOptions,
): NxSchema {
  const { rest, name, title, additionalProperties, properties, description } =
    options;

  return {
    ...rest,
    $schema: 'http://json-schema.org/schema',
    $id: name,
    title: title ?? name,
    type: 'object',
    additionalProperties: additionalProperties ?? true,
    properties,
    ...(description ? { description } : {}),
  };
}

export type CreateNxSchemaOptions = Zod2NxSchemaOptions & {
  baseProps: Record<string, NxJSONSchemaDefinition>;
  rest: Omit<NxJSONSchema, 'properties'>;
};

export function createNxSchema(options: CreateNxSchemaOptions): NxSchema {
  const {
    name,
    title,
    description,
    additionalProperties,
    includeCommandDefault,
    baseProps,
    rest,
  } = options;

  const properties = buildSchemaProperties(baseProps, includeCommandDefault);

  return buildSchemaResult({
    rest,
    name,
    title,
    description,
    additionalProperties,
    properties,
  });
}

/* ---------------------------------- */
/* Public API                         */
/* ---------------------------------- */

export const zod2NxSchemaOptionsSchema = z
  .object({
    name: nameSchema,
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    includeCommandDefault: includeCommandDefaultSchema.optional(),
    additionalProperties: additionalPropertiesSchema.optional(),
  })
  .strict();
export type Zod2NxSchemaOptions = z.infer<typeof zod2NxSchemaOptionsSchema>;

export function zod2nxSchema(
  zodSchema: z.ZodTypeAny,
  options: Zod2NxSchemaOptions,
): NxSchema {
  const {
    name,
    title = name,
    description,
    includeCommandDefault = true,
    additionalProperties = true,
  } = options;

  // Zod → JSON Schema (NOT Zod types anymore)
  const baseSchema = z.toJSONSchema(zodSchema) as NxJSONSchema;

  const { properties = {}, ...rest } = baseSchema;

  return createNxSchema({
    name,
    title,
    description,
    additionalProperties,
    includeCommandDefault,
    baseProps: properties,
    rest,
  });
}
