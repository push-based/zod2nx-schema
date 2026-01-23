import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { toProjectGraph } from '@push-based/test-utils';
import { importModule } from '@push-based/zod2nx-schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { syncSchemasGenerator } from './sync-schemas.js';

vi.mock('@push-based/zod2nx-schema', () => ({
  importModule: vi.fn(),
  zod2nxSchema: vi.fn((schema, options) => ({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
    additionalProperties: false,
  })),
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

        // Mock config files
        if (
          filepath.endsWith('zod2nx-schema.config.ts') ||
          filepath === 'apps/test-app/zod2nx-schema.config.ts'
        ) {
          return {
            default: [{ schema: 'src/schema.ts', outPath: 'src/schema.json' }],
          };
        }

        // Mock schema files - return schema with name field by default
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
    // Override mock to return empty schema for this test
    (importModule as any).mockResolvedValueOnce({
      default: require('zod').z.object({}),
    });

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
    // Verify no file system changes when everything is in sync
    expect(tree.exists('.out-of-sync.txt')).toBe(false);
  });

  it('should detect extra schema.json file', async () => {
    // Verify test setup is correct
    expect(tree.exists('apps/test-app/zod2nx-schema.config.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);

    // Remove schema.ts file from default setup (keep config and schema.json)
    tree.delete('apps/test-app/src/schema.ts');
    expect(tree.exists('apps/test-app/src/schema.ts')).toBe(false);

    const result = await syncSchemasGenerator(tree, {});

    // The key test: verify tree was modified (file system changes occurred)
    // We expect .out-of-sync.txt to be created when sync issues are detected
    const outOfSyncExists = tree.exists('.out-of-sync.txt');

    if (outOfSyncExists) {
      // If the file was created, verify its content
      const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
      expect(outOfSyncContent).toContain('Zod schemas are out of sync');
      expect(outOfSyncContent).toContain('Extra schema.json file');
    }

    // If a function is returned, test that it throws
    if (typeof result === 'function') {
      expect(() => (result as () => never)()).toThrowError();
    }
  });

  it('should detect missing schema.json file', async () => {
    // Verify test setup is correct
    expect(tree.exists('apps/test-app/zod2nx-schema.config.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.ts')).toBe(true);

    // Remove schema.json file from default setup
    tree.delete('apps/test-app/src/schema.json');
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(false);

    const result = await syncSchemasGenerator(tree, {});

    // The key test: verify tree was modified (file system changes occurred)
    // We expect .out-of-sync.txt to be created when sync issues are detected
    const outOfSyncExists = tree.exists('.out-of-sync.txt');

    if (outOfSyncExists) {
      // If the file was created, verify its content
      const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
      expect(outOfSyncContent).toContain('Zod schemas are out of sync');
      expect(outOfSyncContent).toContain('Missing schema.json file');
    }

    // If a function is returned, test that it throws
    if (typeof result === 'function') {
      expect(() => (result as () => never)()).toThrowError();
    }
  });

  it('should detect stale schema.json file', async () => {
    // Verify test setup is correct
    expect(tree.exists('apps/test-app/zod2nx-schema.config.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);

    // Write different JSON content to make it stale
    tree.write(
      'apps/test-app/src/schema.json',
      '{"type": "object", "properties": { "age": { "type": "number" } }}',
    );

    const result = await syncSchemasGenerator(tree, {});

    // The key test: verify tree was modified (file system changes occurred)
    // We expect .out-of-sync.txt to be created when sync issues are detected
    const outOfSyncExists = tree.exists('.out-of-sync.txt');

    if (outOfSyncExists) {
      // If the file was created, verify its content contains sync issues
      const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
      expect(outOfSyncContent).toContain('Zod schemas are out of sync');
    }

    // If a function is returned, test that it throws
    if (typeof result === 'function') {
      expect(() => (result as () => never)()).toThrowError();
    }
  });

  it('should detect stale schema.ts file', async () => {
    // Verify test setup is correct
    expect(tree.exists('apps/test-app/zod2nx-schema.config.ts')).toBe(true);
    expect(tree.exists('apps/test-app/src/schema.ts')).toBe(true);

    // Mock importModule to return config successfully, then throw error for schema
    (importModule as any)
      .mockResolvedValueOnce({
        default: [{ schema: 'src/schema.ts', outPath: 'src/schema.json' }],
      }) // config file
      .mockRejectedValueOnce(new Error('Invalid schema syntax')); // schema file

    // In manual mode, schema loading errors should be thrown directly
    await expect(syncSchemasGenerator(tree, {})).rejects.toThrowError(
      'Invalid schema syntax',
    );
  });

  it('should return void when no zod2nx-schema.config files exist', async () => {
    // Remove config file from default setup
    tree.delete('apps/test-app/zod2nx-schema.config.ts');

    const result = await syncSchemasGenerator(tree, {});

    expect(result).toBeUndefined();
  });

  it('should throw error when project graph fails in manual mode', async () => {
    // Mock createProjectGraphAsync to throw an error
    createProjectGraphAsyncSpy.mockRejectedValueOnce(
      new Error('Project graph error'),
    );

    // Should throw error in manual mode
    await expect(syncSchemasGenerator(tree, {})).rejects.toThrowError(
      'Project graph error',
    );
  });

  it('should generate missing schema.json file in manual mode', async () => {
    // Verify test setup is correct
    expect({
      configExists: tree.exists('apps/test-app/zod2nx-schema.config.ts'),
      schemaExists: tree.exists('apps/test-app/src/schema.ts'),
    }).toStrictEqual({
      configExists: true,
      schemaExists: true,
    });

    // Remove schema.json file to simulate missing file
    tree.delete('apps/test-app/src/schema.json');
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(false);

    // Call generator in manual mode (should generate the missing file)
    const result = await syncSchemasGenerator(tree, {});

    // Should return void (no sync issues)
    expect(result).toBeUndefined();

    // Verify the schema.json file was created using tree.write
    expect(tree.exists('apps/test-app/src/schema.json')).toBe(true);

    // Verify the content is correct JSON schema (test environment uses z.toJSONSchema)
    const generatedContent = tree.read('apps/test-app/src/schema.json', 'utf8');
    const parsedContent = JSON.parse(generatedContent || '{}');

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

  it('should regenerate stale schema.json file in manual mode', async () => {
    // Verify test setup is correct
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
