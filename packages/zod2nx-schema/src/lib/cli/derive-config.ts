import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { toPascalCaseSchemaName } from '../utils/transform.js';
import type { Zond2NxSchemaConfig } from './read-rc-file.js';

export async function loadConfigFromPackageJson(
  pkgPath: string,
): Promise<Zond2NxSchemaConfig> {
  const projectRoot = path.dirname(pkgPath);
  const toAbsolute = (p: string) =>
    path.isAbsolute(p) ? p : path.join(projectRoot, p);
  const { generators: generatorsPath, executors: executorsPath } = JSON.parse(
    (await readFile(pkgPath)).toString(),
  );
  const { generators }: NxGeneratorsJson = JSON.parse(
    (await readFile(toAbsolute(generatorsPath))).toString(),
  );
  const { executors }: NxExecutorsJson = JSON.parse(
    (await readFile(toAbsolute(executorsPath))).toString(),
  );

  return [
    ...runnablesToSchemaOptions('generator', generators, projectRoot),
    ...runnablesToSchemaOptions('executor', executors, projectRoot),
  ];
}

export type NxGeneratorsJson = {
  /**
   * Optional JSON schema reference
   */
  $schema?: string;

  /**
   * Map of generator names to generator definitions
   */
  generators: Record<string, NxGeneratorEntry>;
};

export type NxGeneratorEntry = {
  /**
   * Path to the generator implementation
   * (module exporting the generator function)
   */
  factory: string;

  /**
   * Path to the JSON schema describing options
   */
  schema: string;

  /**
   * Human-readable description (used in `nx g`)
   */
  description?: string;

  /**
   * Optional aliases for the generator
   */
  aliases?: string[];

  /**
   * Whether the generator is hidden from `nx g`
   */
  hidden?: boolean;
};

export type NxExecutorsJson = {
  /**
   * Optional JSON schema reference
   */
  $schema?: string;

  /**
   * Map of executor names to executor definitions
   */
  executors: Record<string, NxExecutorEntry>;
};

export type NxExecutorEntry = {
  /**
   * Path to the executor implementation
   * (module exporting the executor function)
   */
  implementation: string;

  /**
   * Path to the JSON schema describing options
   */
  schema: string;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Optional aliases for the executor
   */
  aliases?: string[];

  /**
   * Whether the executor is hidden from `
   nx
   run`
   */
  hidden?: boolean;
};

export type RunnableKind = 'generator' | 'executor';
export type RunnableEntry = NxGeneratorEntry | NxExecutorEntry;

export function runnableEntryToSchemaOptions(
  kind: RunnableKind,
  id: string,
  entry: RunnableEntry,
  projectRoot: string,
): Zond2NxSchemaConfig[number] {
  const name = toPascalCaseSchemaName(id);

  const aliasesText = entry.aliases?.length
    ? `aliases: ${entry.aliases.join(', ')}`
    : '';

  const description = `${entry.description ?? ''} ${aliasesText}`.trim();

  const JSON_EXTENSION = '.json';
  const schemaBasePath = entry.schema.replace(JSON_EXTENSION, '');
  return {
    schema: path.join(projectRoot, `${schemaBasePath}.ts`),
    outPath: path.join(projectRoot, entry.schema),
    options: {
      name,
      title: `${name} ${kind === 'generator' ? 'Generator' : 'Executor'} Options`,
      description,
    },
  };
}

export function runnablesToSchemaOptions(
  kind: RunnableKind,
  runnables: Record<string, RunnableEntry>,
  projectRoot: string,
): Zond2NxSchemaConfig {
  return Object.entries(runnables).map(([id, entry]) =>
    runnableEntryToSchemaOptions(kind, id, entry, projectRoot),
  );
}
