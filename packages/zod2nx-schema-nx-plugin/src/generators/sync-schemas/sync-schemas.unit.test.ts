import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { toProjectGraph } from '@push-based/test-utils';
import { importModule } from '@push-based/zod2nx-schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { syncSchemasGenerator } from './sync-schemas.js';

vi.mock('@push-based/zod2nx-schema', async original => ({
  ...((await original()) as object),
  importModule: vi.fn(),
}));

describe('syncSchemasGenerator', () => {
  const setupPluginProject = () => {
    tree.write(
      'apps/test-app/zod2nx-schema.config.ts',
      'export default [{ schema: "src/schema.ts", outPath: "src/schema.json" }];',
    );
    tree.write(
      'apps/test-app/src/schema.ts',
      'import { z } from "zod"; export default z.object({ name: z.string() });',
    );
    tree.write(
      'apps/test-app/src/schema.json',
      JSON.stringify({
        $schema: 'http://json-schema.org/schema',
        $id: 'default',
        title: 'default',
        type: 'object',
        additionalProperties: true,
        properties: {
          name: { type: 'string' },
        },
      }),
    );

    const projectGraph = toProjectGraph([
      {
        name: 'test-app',
        type: 'app',
        data: {
          root: 'apps/test-app',
        },
      },
    ]);

    createProjectGraphAsyncSpy.mockResolvedValue(projectGraph);
  };
  let tree: devKit.Tree;
  const createProjectGraphAsyncSpy = vi.spyOn(
    devKit,
    'createProjectGraphAsync',
  );

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    setupPluginProject();

    // Default mock implementation
    (importModule as any).mockImplementation(
      async (options: { filepath: string }) => {
        const filepath = options.filepath;

        if (
          filepath.endsWith('zod2nx-schema.config.ts') ||
          filepath === 'apps/test-app/zod2nx-schema.config.ts'
        ) {
          return {
            default: [{ schema: 'src/schema.ts', outPath: 'src/schema.json' }],
          };
        }

        if (
          filepath.endsWith('schema.ts') ||
          filepath === 'apps/test-app/src/schema.ts'
        ) {
          return {
            default: z.object({ name: z.string() }),
          };
        }

        return { default: undefined };
      },
    );
  });

  afterEach(() => {
    createProjectGraphAsyncSpy.mockReset();
  });

  it('should return void when no issues found', async () => {
    (importModule as any).mockResolvedValueOnce({
      default: require('zod').z.object({}),
    });

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
  });

  it('should remove extra schema.json file', async () => {
    expect(tree.exists('apps/test-app/zod2nx-schema.config.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);

    tree.delete('apps/test-app/src/schema.ts');
    expect(tree.exists('apps/test-app/src/schema.ts')).toBe(false);

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(false);
  });

  it('should generate missing schema.json file', async () => {
    expect(tree.exists('apps/test-app/zod2nx-schema.config.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.ts')).toBe(true);

    tree.delete('apps/test-app/src/schema.json');
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(false);

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);
  });

  it('should regenerate stale schema.json file', async () => {
    expect(tree.exists('apps/test-app/zod2nx-schema.config.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);

    // Write different JSON content to make it stale
    tree.write(
      'apps/test-app/src/schema.json',
      '{"type": "object", "properties": { "age": { "type": "number" } }}',
    );

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
    const regeneratedContent = tree.read(
      'apps/test-app/src/schema.json',
      'utf8',
    );
    const parsedContent = JSON.parse(regeneratedContent || '{}');
    expect(parsedContent.properties).toHaveProperty('name');
  });

  it('should detect stale schema.ts file', async () => {
    (importModule as any)
      .mockResolvedValueOnce({
        default: [{ schema: 'src/schema.ts', outPath: 'src/schema.json' }],
      })
      .mockRejectedValueOnce(new Error('Invalid schema syntax')); // schema file

    await expect(syncSchemasGenerator(tree, {})).rejects.toThrowError(
      'Invalid schema syntax',
    );
  });

  it('should return void when no zod2nx-schema.config files exist', async () => {
    tree.delete('apps/test-app/zod2nx-schema.config.ts');

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
  });

  it('should throw error when project graph fails in manual mode', async () => {
    createProjectGraphAsyncSpy.mockRejectedValueOnce(
      new Error('Project graph error'),
    );

    await expect(syncSchemasGenerator(tree, {})).rejects.toThrowError(
      'Project graph error',
    );
  });

  it('should generate missing schema.json file in manual mode', async () => {
    expect({
      configExists: tree.exists('apps/test-app/zod2nx-schema.config.ts'),
      schemaExists: tree.exists('apps/test-app/src/schema.ts'),
    }).toStrictEqual({
      configExists: true,
      schemaExists: true,
    });

    tree.delete('apps/test-app/src/schema.json');
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(false);

    const result = await syncSchemasGenerator(tree, {});
    expect(result).toBeUndefined();
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);
    const generatedContent = tree.read('apps/test-app/src/schema.json', 'utf8');
    const parsedContent = JSON.parse(generatedContent || '{}');
    expect(parsedContent).toStrictEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    });
  });

  it('should regenerate stale schema.json file in manual mode', async () => {
    expect({
      configExists: tree.exists('apps/test-app/zod2nx-schema.config.ts'),
      schemaExists: tree.exists('apps/test-app/src/schema.ts'),
      jsonExists: tree.exists('apps/test-app/src/schema.json'),
    }).toStrictEqual({
      configExists: true,
      schemaExists: true,
      jsonExists: true,
    });

    // Make the schema.json stale by writing different content
    const staleContent = {
      type: 'object',
      properties: { age: { type: 'number' } },
    };
    tree.write(
      'apps/test-app/src/schema.json',
      JSON.stringify(staleContent, null, 2),
    );

    // Verify it's actually stale (different from what should be generated)
    const currentContent = JSON.parse(
      tree.read('apps/test-app/src/schema.json', 'utf8') || '{}',
    );
    expect(currentContent.properties).toStrictEqual({
      age: { type: 'number' },
    });

    // Call generator in manual mode (should regenerate the stale file)
    const result = await syncSchemasGenerator(tree, {});

    // Should return void (no sync issues)
    expect(result).toBeUndefined();

    // Verify the schema.json file was regenerated using tree.write
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);

    // Verify the content was updated to match the schema.ts (test environment uses z.toJSONSchema)
    const regeneratedContent = tree.read(
      'apps/test-app/src/schema.json',
      'utf8',
    );
    const parsedContent = JSON.parse(regeneratedContent || '{}');

    // In test environment, it uses z.toJSONSchema which produces complete JSON schema
    expect(parsedContent).toStrictEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    });
  });

  it('should remove extra schema.json file in manual mode', async () => {
    // Verify test setup is correct
    expect({
      configExists: tree.exists('apps/test-app/zod2nx-schema.config.ts'),
      jsonExists: tree.exists('apps/test-app/src/schema.json'),
    }).toStrictEqual({
      configExists: true,
      jsonExists: true,
    });

    // Remove schema.ts file to simulate it no longer existing
    tree.delete('apps/test-app/src/schema.ts');
    expect({
      schemaExists: tree.exists('apps/test-app/src/schema.ts'),
      jsonExists: tree.exists('apps/test-app/src/schema.json'),
    }).toStrictEqual({
      schemaExists: false,
      jsonExists: true, // But schema.json still exists
    });

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(false);
  });
});
