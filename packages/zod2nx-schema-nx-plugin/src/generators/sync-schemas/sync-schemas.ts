import {Tree, createProjectGraphAsync, joinPathFragments, logger} from '@nx/devkit';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { z } from 'zod';
import { bundleRequire } from 'bundle-require';

/**
 * Minimal implementation of zod2nxSchema for sync checking
 */
function zod2nxSchema(
  zodSchema: z.ZodTypeAny,
  options: { name: string; title?: string; description?: string; includeCommandDefault?: boolean; additionalProperties?: boolean }
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

async function loadConfigFile(tree: Tree, path: string): Promise<Zod2NxConfig[]> {
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
function loadModuleExport<T = Record<string, unknown>>(
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

export async function syncSchemasSyncGenerator(
  tree: Tree
): Promise<SyncGeneratorResult | void> {
  const graph = await createProjectGraphAsync();
  const issues: string[] = [];
  return assertOutOfSync(tree, '????'+ JSON.stringify(options));

  // If config is provided, use that specific config file
  if (options.config && tree.exists(options.config)) {
    try {
      const configs = await loadConfigFile(tree, options.config);
      // Process the specific config file
      for (const cfg of configs) {
        // Skip configs that don't have schema (e.g., fromPkg configs)
        if (!cfg.schema) continue;

        const schemaPath = resolvePath('', cfg.schema);
        const jsonPath = resolvePath(
          '',
          cfg.outPath,
          cfg.schema ? cfg.schema.replace(/\.ts$/, '.json') : undefined,
        );

        if (!tree.exists(schemaPath)) {
          issues.push(`missing schema ${cfg.schema}`);
          continue;
        }

        if (!tree.exists(jsonPath)) {
          issues.push(`missing json ${jsonPath}`);
          continue;
        }

        try {
          const zodSchema = loadModuleExport<z.ZodTypeAny>(
            schemaPath,
            cfg.exportName,
          );

          const expected = zod2nxSchema(zodSchema, {
            name: cfg.options?.name ?? cfg.schema.split('/').pop() ?? 'Schema',
            title: cfg.options?.title,
            description: cfg.options?.description,
            includeCommandDefault: cfg.options?.includeCommandDefault,
            additionalProperties: cfg.options?.additionalProperties,
          });

          const actual = JSON.parse(
            tree.read(jsonPath, 'utf-8')!,
          );

          if (!jsonEqual(expected, actual)) {
            issues.push(`stale schema ${jsonPath}`);
          }
        } catch (e) {
          issues.push(`failed to validate ${jsonPath}: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      issues.push(`failed to load ${options.config}`);
    }
  }

  // If neither fromPkg nor config is provided, fall back to scanning all projects
  if (!options.fromPkg && !options.config) {
    for (const node of Object.values(graph.nodes)) {
      const root = node.data.root;
      const configPath = [
        'zod2nx-schema.config.ts',
        'zod2nx-schema.config.js',
        'zod2nx-schema.config.mjs',
      ]
        .map(p => joinPathFragments(root, p))
        .find(p => tree.exists(p));

      if (!configPath) continue;

    let configs: Zod2NxConfig[];
    try {
      configs = await loadConfigFile(tree, configPath);
    } catch (e) {
      issues.push(`${node.name}: failed to load ${configPath}`);
      continue;
    }

    for (const cfg of configs) {
      // Skip configs that don't have schema (e.g., fromPkg configs)
      if (!cfg.schema) continue;

      const schemaPath = resolvePath(root, cfg.schema);
      const jsonPath = resolvePath(
        root,
        cfg.outPath,
        cfg.schema ? cfg.schema.replace(/\.ts$/, '.json') : undefined,
      );

      if (!tree.exists(schemaPath)) {
        issues.push(`${node.name}: missing schema ${cfg.schema}`);
        continue;
      }

      if (!tree.exists(jsonPath)) {
        issues.push(`${node.name}: missing json ${jsonPath}`);
        continue;
      }

      try {
        const zodSchema = loadModuleExport<z.ZodTypeAny>(
          schemaPath,
          cfg.exportName,
        );

        const expected = zod2nxSchema(zodSchema, {
          name: cfg.options?.name ?? cfg.schema.split('/').pop() ?? 'Schema',
          title: cfg.options?.title,
          description: cfg.options?.description,
          includeCommandDefault: cfg.options?.includeCommandDefault,
          additionalProperties: cfg.options?.additionalProperties,
        });

        const actual = JSON.parse(
          tree.read(jsonPath, 'utf-8')!,
        );

        if (!jsonEqual(expected, actual)) {
          issues.push(`${node.name}: stale schema ${jsonPath}`);
        }
      } catch (e) {
        issues.push(`${node.name}: failed to validate ${jsonPath}: ${(e as Error).message}`);
      }
    }
    }
  }

  console.log(`SYNC GENERATOR: ${issues.length} issues found`);
  issues.forEach(issue => console.log(`ISSUE: ${issue}`));

  // Always write to file
  const message = issues.length === 0 ? `SYNC!!!! ${new Date().toISOString()}` : `Zod schemas are out of sync\n${issues.map(i => `- ${i}`).join('\n')}`;
  console.log(`WRITING MESSAGE: ${message}`);
  assertOutOfSync(tree, message);

  // Always return a result
  const result = {
    outOfSyncMessage: issues.length === 0 ? 'SYNC!!!!' : 'Zod schemas are out of sync',
    outOfSyncDetails: issues.length === 0 ? undefined : issues.map(i => `- ${i}`),
  };
  console.log(`RETURNING:`, result);
  return result;
}

export { syncSchemasSyncGenerator as syncGenerator };
export default syncSchemasSyncGenerator;
