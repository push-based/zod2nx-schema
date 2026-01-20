import {
  Tree,
  createProjectGraphAsync,
  glob,
  joinPathFragments,
  logger,
} from '@nx/devkit';
import { bundleRequire } from 'bundle-require';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { ZOD2NX_SCHEMA_CONFIG_NAME } from '@push-based/zod2nx-schema';
import { z } from 'zod';

/**
 * Minimal implementation of zod2nxSchema for sync checking
 */
function zod2nxSchema(
  zodSchema: z.ZodTypeAny,
  options: {
    name: string;
    title?: string;
    description?: string;
    includeCommandDefault?: boolean;
    additionalProperties?: boolean;
  },
) {
  const {
    name,
    title = name,
    description,
    includeCommandDefault = true,
    additionalProperties = true,
  } = options;

  // Convert Zod schema to JSON Schema
  const baseSchema = z.toJSONSchema(zodSchema);

  return {
    $schema: 'http://json-schema.org/schema',
    $id: name,
    title: title,
    type: 'object',
    additionalProperties,
    properties: baseSchema.properties || {},
    ...(description ? { description } : {}),
  };
}

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
  const { mod } = await bundleRequire({
    filepath: path,
    format: 'esm',
  });

  const value = mod.default ?? mod;
  return Array.isArray(value) ? value : [value];
}

function resolvePath(root: string, p?: string, fallback?: string) {
  return joinPathFragments(root, p ?? fallback ?? '');
}

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function assertOutOfSync(tree: Tree, message: string): SyncGeneratorResult {
  tree.write('.out-of-sync.txt', message + '\n');
  return {
    outOfSyncMessage: message,
  };
}

/**
 * Load a module export dynamically (similar to loadModuleExport from zod2nx-schema)
 */
export function loadModuleExport<T = Record<string, unknown>>(
  schemaModulePath: string,
  exportName: string = 'default',
): T {
  // Use require for CommonJS modules (most Nx plugins use CommonJS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = require(schemaModulePath) as any;

  const exportedValue = module[exportName] as T;
  if (!exportedValue) {
    throw new Error(
      `Export '${exportName}' not found in module '${schemaModulePath}'`,
    );
  }

  return exportedValue;
}

export interface SyncSchemasGeneratorSchema {}

export async function syncSchemasGenerator(
  tree: Tree,
  options: SyncSchemasGeneratorSchema,
  // For testing: allow injecting a custom module loader
  loadModuleExportFn: typeof loadModuleExport = loadModuleExport,
): Promise<void> {
  const graph = await createProjectGraphAsync();
  const issues: string[] = [];

  // Find all zod2nx-schema.config files in the workspace
  const configFiles = await glob(tree, [
    `**/${ZOD2NX_SCHEMA_CONFIG_NAME}.*`,
  ]);

  if (configFiles.length === 0) {
    logger.info('Skip no config file found');
    const message = `SYNC!!!! ${new Date().toISOString()}`;
    tree.write('.out-of-sync.txt', message + '\n');
    return;
  }

  // Process each config file
  for (const configFile of configFiles) {
    try {
      const configs = await loadConfigFile(tree, configFile);

      for (const config of configs) {
        const schemaPath = config.schema;
        const outPath = config.outPath;

        if (!schemaPath || !outPath) continue;

        // Resolve paths relative to the config file directory
        const configDir = configFile.substring(0, configFile.lastIndexOf('/'));
        const resolvedSchemaPath = joinPathFragments(configDir, schemaPath);
        const resolvedOutPath = joinPathFragments(configDir, outPath);

        // Check sync conditions
        const schemaExists = tree.exists(resolvedSchemaPath);
        const jsonExists = tree.exists(resolvedOutPath);

        if (schemaExists && !jsonExists) {
          // Missing: schema.ts exists but schema.json doesn't
          issues.push(`Missing schema.json file: ${resolvedOutPath} (schema.ts exists)`);
        } else if (schemaExists && jsonExists) {
          // Stale: schema.json content doesn't match what would be generated from schema.ts
          try {
            const schemaModule = loadModuleExportFn(resolvedSchemaPath, config.exportName);
            const zodSchema = schemaModule as z.ZodTypeAny;

            const expectedJson = zod2nxSchema(zodSchema, config.options || {});
            const actualJson = JSON.parse(tree.read(resolvedOutPath, 'utf8') || '{}');

            if (!jsonEqual(expectedJson, actualJson)) {
              issues.push(`Stale schema.json file: ${resolvedOutPath} (content doesn't match schema.ts)`);
            }
          } catch (error) {
            issues.push(`Error processing schema files: ${resolvedSchemaPath} - ${error}`);
          }
        } else if (!schemaExists && jsonExists) {
          // Extra: schema.json exists but schema.ts doesn't
          issues.push(`Extra schema.json file: ${resolvedOutPath} (schema.ts no longer exists)`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to process config file ${configFile}: ${error}`);
    }
  }

  console.log(`SYNC GENERATOR: ${issues.length} issues found`);
  issues.forEach(issue => console.log(`ISSUE: ${issue}`));

  // Always write to file
  const message =
    issues.length === 0
      ? `SYNC!!!! ${new Date().toISOString()}`
      : `Zod schemas are out of sync\n${issues.map(i => `- ${i}`).join('\n')}`;
  console.log(`WRITING MESSAGE: ${message}`);
  tree.write('.out-of-sync.txt', message + '\n');
}

export default syncSchemasGenerator;
