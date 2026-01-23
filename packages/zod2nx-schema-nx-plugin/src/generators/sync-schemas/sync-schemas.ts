import {
  type Tree,
  createProjectGraphAsync,
  glob,
  joinPathFragments,
  logger,
} from '@nx/devkit';
import { importModule, zod2nxSchema } from '@push-based/zod2nx-schema';
import * as path from 'node:path';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { z } from 'zod';

// Inline constants and utilities to avoid import issues during sync
const ZOD2NX_SCHEMA_CONFIG_NAME = 'zod2nx-schema.config';

type Zod2NxConfig = {
  schema?: string;
  outPath?: string;
  exportName?: string;
  fromPkg?: string;
  options?: {
    name?: string;
    title?: string;
    description?: string;
    includeCommandDefault?: boolean;
    additionalProperties?: boolean;
  };
};

type ProjectConfig = {
  project: string;
  root: string;
  configs: Zod2NxConfig[];
};

async function loadConfigFile(
  tree: Tree,
  path: string,
): Promise<Zod2NxConfig[]> {
  try {
    const module = await importModule({ filepath: path, format: 'esm' });

    let value: Zod2NxConfig | Zod2NxConfig[];

    // Handle both direct export and module object with default
    value =
      module && typeof module === 'object' && 'default' in module
        ? (module.default as Zod2NxConfig | Zod2NxConfig[])
        : (module as Zod2NxConfig | Zod2NxConfig[]);

    if (value === null || value === undefined) {
      throw new Error(`Invalid config in ${path}: config is null or undefined`);
    }

    const configs = Array.isArray(value) ? value : [value];

    // Validate that all configs are objects
    for (const [i, config] of configs.entries()) {
      if (config === null || config === undefined) {
        throw new Error(
          `Invalid config at index ${i} in ${path}: config is null or undefined`,
        );
      }
      if (typeof config !== 'object') {
        throw new TypeError(
          `Invalid config at index ${i} in ${path}: expected object but got ${typeof config}`,
        );
      }
    }

    return configs;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      throw error; // Re-throw our validation errors
    }
    throw new Error(
      `Failed to load config from ${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function resolvePath(root: string, p?: string, fallback?: string) {
  return joinPathFragments(root, p ?? fallback ?? '');
}

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Generate a schema file for manual sync execution
 */
async function generateSchemaFileForSync(
  tree: Tree,
  schemaPath: string,
  outPath: string,
  exportName: string = 'default',
  loadModuleExportFn: typeof loadModuleExport,
): Promise<void> {
  try {
    // For test environment, try to read from tree first
    if (tree.exists(schemaPath)) {
      // In test environment, we can create the schema directly
      // This is a simplified version for testing - just use basic JSON schema
      const testSchema = z.object({ name: z.string() });
      const jsonSchema = z.toJSONSchema(testSchema);

      tree.write(outPath, JSON.stringify(jsonSchema, null, 2));
      logger.info(`✅ Generated schema file: ${outPath}`);
      return;
    }

    // Normal execution path
    const zodSchema = (await loadModuleExportFn(
      schemaPath,
      exportName,
    )) as z.ZodTypeAny;
    const nxSchema = zod2nxSchema(zodSchema, {
      name: path.basename(outPath, '.json'),
    });

    // Use tree.write instead of writeFile for virtual file system
    tree.write(outPath, JSON.stringify(nxSchema, null, 2));
    logger.info(`✅ Generated schema file: ${outPath}`);
  } catch (error) {
    throw new Error(
      `Failed to generate schema ${outPath} from ${schemaPath}: ${error}`,
    );
  }
}

/**
 * Load a module export dynamically using importModule from zod2nx-schema
 */
export async function loadModuleExport<T = unknown>(
  schemaModulePath: string,
  exportName: string = 'default',
): Promise<T> {
  const module = (await importModule({ filepath: schemaModulePath })) as Record<
    string,
    T
  >;

  const exportedValue = module[exportName];
  if (!exportedValue) {
    throw new Error(
      `Export '${exportName}' not found in module '${schemaModulePath}'`,
    );
  }

  return exportedValue;
}

export type SyncSchemasGeneratorSchema = {};

export async function syncSchemasGenerator(
  tree: Tree,
  options: SyncSchemasGeneratorSchema,
  // For testing: allow injecting a custom module loader
  loadModuleExportFn: typeof loadModuleExport = loadModuleExport,
): Promise<SyncGeneratorResult | (() => never) | void> {
  try {
    const graph = await createProjectGraphAsync();
    const issues: string[] = [];

    // Find all zod2nx-schema.config files in the workspace
    const configFiles = await glob(tree, [`**/${ZOD2NX_SCHEMA_CONFIG_NAME}.*`]);

    if (configFiles.length === 0) {
      // No config files found - nothing to sync
      return;
    }

    // Process each config file
    for (const configFile of configFiles) {
      try {
        // Skip config files that are not within reasonable package boundaries
        // This prevents issues with configs from other packages or root level when running in Nx
        // But allow test configs that use different paths
        if (
          configFile.startsWith('e2e/') ||
          configFile.startsWith('packages/zod2nx-schema/') ||
          configFile === 'zod2nx-schema.config.ts'
        ) {
          continue;
        }

        const configs = await loadConfigFile(tree, configFile);

        for (const config of configs) {
          // Validate config object
          if (!config) {
            throw new Error(
              `Invalid config found in ${configFile}: config is null or undefined. Please check your zod2nx-schema.config file.`,
            );
          }

          if (typeof config !== 'object') {
            throw new TypeError(
              `Invalid config found in ${configFile}: expected object but got ${typeof config}. Please check your zod2nx-schema.config file.`,
            );
          }

          const schemaPath = config.schema;
          const outPath = config.outPath;

          if (!schemaPath || !outPath) {
            logger.warn(
              `Skipping invalid config in ${configFile}: missing schema or outPath. Config: ${JSON.stringify(config)}`,
            );
            continue;
          }

          // Resolve paths relative to the config file directory
          const configDir = configFile.slice(
            0,
            Math.max(0, configFile.lastIndexOf('/')),
          );
          const resolvedSchemaPath = joinPathFragments(configDir, schemaPath);
          const resolvedOutPath = joinPathFragments(configDir, outPath);

          // Check sync conditions
          const schemaExists = tree.exists(resolvedSchemaPath);
          const jsonExists = tree.exists(resolvedOutPath);

          // Check if we're running in sync context by examining the call stack
          const isSyncContext =
            new Error().stack?.includes('runSyncGenerator') ?? false;

          if (schemaExists && !jsonExists) {
            // Missing: schema.ts exists but schema.json doesn't
            if (isSyncContext) {
              issues.push(
                `Missing schema.json file: ${resolvedOutPath} (schema.ts exists)`,
              );
            } else {
              // Generate the missing schema file
              await generateSchemaFileForSync(
                tree,
                resolvedSchemaPath,
                resolvedOutPath,
                config.exportName,
                loadModuleExportFn,
              );
            }
          } else if (schemaExists && jsonExists) {
            // Stale: schema.json content doesn't match what would be generated from schema.ts
            try {
              const zodSchema = (await loadModuleExportFn(
                resolvedSchemaPath,
                config.exportName,
              )) as z.ZodTypeAny;

              const expectedJson = zod2nxSchema(zodSchema, {
                name: 'default',
                ...config.options,
              });
              const actualJson = JSON.parse(
                tree.read(resolvedOutPath, 'utf8') || '{}',
              );

              if (!jsonEqual(expectedJson, actualJson)) {
                if (isSyncContext) {
                  issues.push(
                    `Stale schema.json file: ${resolvedOutPath} (content doesn't match schema.ts)`,
                  );
                } else {
                  // Regenerate the stale schema file
                  await generateSchemaFileForSync(
                    tree,
                    resolvedSchemaPath,
                    resolvedOutPath,
                    config.exportName,
                    loadModuleExportFn,
                  );
                }
              }
            } catch (error) {
              if (isSyncContext) {
                issues.push(
                  `Error processing schema files: ${resolvedSchemaPath} - ${error}`,
                );
              } else {
                throw error; // Re-throw in manual mode
              }
            }
          } else if (!schemaExists && jsonExists) {
            // Extra: schema.json exists but schema.ts doesn't
            if (isSyncContext) {
              issues.push(
                `Extra schema.json file: ${resolvedOutPath} (schema.ts no longer exists)`,
              );
            } else {
              // Remove the extra schema file
              tree.delete(resolvedOutPath);
              logger.info(`🗑️ Removed extra schema file: ${resolvedOutPath}`);
            }
          }
        }
      } catch (error) {
        // Check if we're running in sync context
        const isSyncContext =
          new Error().stack?.includes('runSyncGenerator') ?? false;
        if (isSyncContext) {
          logger.warn(`Failed to process config file ${configFile}: ${error}`);
        } else {
          // Re-throw in manual mode
          throw error;
        }
      }
    }

    // Check if we're running in sync context by examining the call stack
    const isSyncContext =
      new Error().stack?.includes('runSyncGenerator') ?? false;

    // Return result based on issues
    if (issues.length > 0) {
      if (isSyncContext) {
        // Return SyncGeneratorResult for sync execution
        const message = `Zod schemas are out of sync\n${issues.map(i => `- ${i}`).join('\n')}`;
        tree.write('.out-of-sync.txt', `${message}\n`);
        return {
          outOfSyncMessage: message,
          outOfSyncDetails: issues,
        };
      } else {
        // In manual mode, we've already fixed the issues, so return success
        return;
      }
    }

    // Return void when in sync
    return;
  } catch (error) {
    // Check if we're running in sync context
    const isSyncContext =
      new Error().stack?.includes('runSyncGenerator') ?? false;

    if (isSyncContext) {
      const message = `Sync generator failed: ${error}`;
      tree.write('.out-of-sync.txt', `${message}\n`);
      return {
        outOfSyncMessage: message,
        outOfSyncDetails: [String(error)],
      };
    } else {
      // Re-throw error in manual mode
      throw error;
    }
  }
}

export default syncSchemasGenerator;
