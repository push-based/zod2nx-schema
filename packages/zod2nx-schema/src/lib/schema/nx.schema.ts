import type { JSONSchema7 } from 'json-schema';
import { z } from 'zod';

/* ---------------------------------- */
/* Nx-specific metadata (Zod-first)   */
/* ---------------------------------- */

export const defaultSourceSchema = z.enum([
  'argv',
  'projectName',
  'project',
  'target',
  'configuration',
  'cwd',
]);
export type DefaultSource = z.infer<typeof defaultSourceSchema>;

export const nxPromptSchema = z.union([
  z.string(),
  z
    .object({
      message: z.string().optional(),
      type: z.enum(['input', 'confirm', 'list', 'multiselect']).optional(),
      items: z
        .array(
          z.union([
            z.string(),
            z
              .object({ value: z.unknown(), label: z.string().optional() })
              .strict(),
          ]),
        )
        .optional(),
      multiselect: z.boolean().optional(),
    })
    .strict(),
]);
export type NxPrompt = z.infer<typeof nxPromptSchema>;

export const nxExtensionsSchema = z
  .object({
    /** Nx/DevKit prompt metadata */
    'x-prompt': nxPromptSchema.optional(),
    /** DevKit-style default source */
    $default: z
      .object({
        $source: defaultSourceSchema,
        index: z.number().int().optional(),
      })
      .strict()
      .optional(),
    /** Optional extras sometimes used in schemas */
    'x-deprecated': z.union([z.boolean(), z.string()]).optional(),
  })
  .strict();
export type NxExtensions = z.infer<typeof nxExtensionsSchema>;

/* ---------------------------------- */
/* JSON Schema modeling (types)       */
/* ---------------------------------- */

export type NxJSONSchemaDefinition = NxJSONSchema | boolean;

export type NxJSONSchema = Omit<
  JSONSchema7,
  'properties' | 'items' | 'oneOf' | 'anyOf' | 'allOf' | 'definitions'
> &
  NxExtensions & {
    properties?: Record<string, NxJSONSchemaDefinition>;
    items?: NxJSONSchemaDefinition | NxJSONSchemaDefinition[];
    oneOf?: NxJSONSchemaDefinition[];
    anyOf?: NxJSONSchemaDefinition[];
    allOf?: NxJSONSchemaDefinition[];
    /** Zod converters often emit `$defs` */
    $defs?: Record<string, NxJSONSchemaDefinition>;
    definitions?: Record<string, NxJSONSchemaDefinition>;
  };

/* ---------------------------------- */
/* Zod config schema (Zod-first)      */
/* ---------------------------------- */

export const nameSchema = z.string().describe('Name of the schema');
export const titleSchema = z.string().describe('Title of the schema');
export const descriptionSchema = z
  .string()
  .describe('Description of the schema');
export const includeCommandDefaultSchema = z
  .boolean()
  .describe('Whether to include a default command property');
export const additionalPropertiesSchema = z
  .boolean()
  .describe('Whether to allow additional properties');

/* ---------------------------------- */
/* Final Nx schema type               */
/* ---------------------------------- */

export type NxSchema = {
  $schema: string;
  $id: string;
  title: string;
  description?: string;
  type: 'object';
  properties: Record<string, NxJSONSchemaDefinition>;
  additionalProperties: boolean;
} & NxJSONSchema;
