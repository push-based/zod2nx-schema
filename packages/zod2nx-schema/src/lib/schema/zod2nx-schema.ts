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
 * Transforms a property definition to use Nx-specific keys.
 * Converts `default: { source: ... }` to `$default: { $source: ... }`
 */
function transformPropertyToNx(
  prop: NxJSONSchemaDefinition,
): NxJSONSchemaDefinition {
  if (typeof prop === 'boolean') {
    return prop;
  }

  const { default: defaultValue, ...rest } = prop as NxJSONSchema & {
    default?: { source?: string; index?: number };
  };

  // If there's a default with source (Nx-specific), transform it
  if (
    defaultValue &&
    typeof defaultValue === 'object' &&
    'source' in defaultValue
  ) {
    const { source, ...defaultRest } = defaultValue;
    return {
      ...rest,
      $default: {
        $source: source,
        ...defaultRest,
      },
    } as NxJSONSchemaDefinition;
  }

  return prop;
}

/**
 * Helper to build schema properties with optional command default
 * and transforms Zod meta keys to Nx-specific keys
 */
function buildSchemaProperties(
  baseProps: Record<string, NxJSONSchemaDefinition>,
  includeCommandDefault?: boolean,
): Record<string, NxJSONSchemaDefinition> {
  // Transform all properties to use Nx-specific keys
  const transformedProps = Object.fromEntries(
    Object.entries(baseProps).map(([key, value]) => [
      key,
      transformPropertyToNx(value),
    ]),
  );

  if (!includeCommandDefault) {
    return transformedProps;
  }

  const command = transformedProps['command'];
  if (!command || typeof command === 'boolean') {
    return transformedProps;
  }

  return {
    ...transformedProps,
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
