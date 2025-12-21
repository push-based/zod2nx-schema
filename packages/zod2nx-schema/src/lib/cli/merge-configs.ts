import path from 'node:path';
import type { GenerateZod2NxSchemaOptions } from '../schema/generate-schema.js';

/**
 * Creates a unique key for a config based on normalized schema path and export name.
 * This key is used to identify duplicate configs that should be merged.
 */
export function createConfigKey(config: GenerateZod2NxSchemaOptions): string {
  const normalizedPath = path.resolve(config.schema);
  const exportName = config.exportName ?? 'default';
  return `${normalizedPath}:${exportName}`;
}

/**
 * Merges two config objects, with the later config taking precedence.
 * Options are shallow-merged (later values override earlier ones).
 */
export function mergeConfigPair(
  existing: GenerateZod2NxSchemaOptions,
  incoming: GenerateZod2NxSchemaOptions,
): GenerateZod2NxSchemaOptions {
  return {
    schema: incoming.schema,
    exportName: incoming.exportName ?? existing.exportName,
    outPath: incoming.outPath ?? existing.outPath,
    options: {
      ...existing.options,
      ...incoming.options,
    },
  };
}

/**
 * Deduplicates and merges configs based on schema path + export name.
 *
 * When multiple configs have the same schema path and export name:
 * - Later configs take precedence for `schema`, `exportName`, and `outPath`
 * - Options are shallow-merged (later values override earlier ones)
 *
 * @param configs - Array of configs to merge
 * @returns Deduplicated array with merged options
 */
export function mergeConfigs(
  configs: GenerateZod2NxSchemaOptions[],
): GenerateZod2NxSchemaOptions[] {
  const configMap = configs.reduce((acc, config) => {
    const key = createConfigKey(config);
    const existing = acc.get(key);
    acc.set(key, existing ? mergeConfigPair(existing, config) : config);
    return acc;
  }, new Map<string, GenerateZod2NxSchemaOptions>());

  return [...configMap.values()];
}
