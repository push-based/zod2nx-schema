import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { toProjectGraph } from '@push-based/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Mock bundle-require to avoid issues with virtual file system
vi.mock('bundle-require', () => ({
  bundleRequire: vi.fn().mockImplementation(async (options: { filepath: string }) => {
    // Mock implementation that returns config based on file content
    const mockConfigs = {
      'apps/test-app/zod2nx-schema.config.ts': [{ schema: 'src/schema.ts', outPath: 'src/schema.json' }],
    };

    const filepath = options.filepath;
    if (mockConfigs[filepath as keyof typeof mockConfigs]) {
      return {
        mod: {
          default: mockConfigs[filepath as keyof typeof mockConfigs],
        },
      };
    }

    return {
      mod: {
        default: [],
      },
    };
  }),
}));

import * as syncSchemasModule from './sync-schemas.js';
const { syncSchemasGenerator } = syncSchemasModule;

describe('syncSchemasGenerator', () => {
  let tree: devKit.Tree;
  const createProjectGraphAsyncSpy = vi.spyOn(devKit, 'createProjectGraphAsync');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  afterEach(() => {
    createProjectGraphAsyncSpy.mockReset();
  });

  it('should write sync success message when no issues found', async () => {
    // Setup project graph with a project that has config and matching schema files
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

    // Mock loadModuleExport function
    const { z } = require('zod');
    const mockLoadFn = vi.fn().mockReturnValue(z.object({}));

    // Create config file and matching schema files
    tree.write('apps/test-app/zod2nx-schema.config.ts', 'export default [{ schema: "src/schema.ts", outPath: "src/schema.json" }];');
    tree.write('apps/test-app/src/schema.ts', 'import { z } from "zod"; export default z.object({});');
    tree.write('apps/test-app/src/schema.json', JSON.stringify({
      $schema: 'http://json-schema.org/schema',
      $id: undefined,
      title: undefined,
      type: 'object',
      additionalProperties: true,
      properties: {}
    }));

    await syncSchemasGenerator(tree, {}, mockLoadFn);

    const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
    expect(outOfSyncContent).toContain('SYNC!!!!');
  });

  it('should detect extra schema.json file', async () => {
    // Setup project graph with a project that has schema.json but no schema.ts
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

    // Create config file and schema.json but no schema.ts
    tree.write('apps/test-app/zod2nx-schema.config.ts', 'export default [{ schema: "src/schema.ts", outPath: "src/schema.json" }];');
    tree.write('apps/test-app/src/schema.json', '{}');

    await syncSchemasGenerator(tree, {});

    const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
    expect(outOfSyncContent).toContain('Zod schemas are out of sync');
    expect(outOfSyncContent).toContain('Extra schema.json file');
  });
  it('should detect missing schema.json file', async () => {
    // Setup project graph with a project that has schema.ts but no schema.json
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

    // Create config file and schema.ts but no schema.json
    tree.write('apps/test-app/zod2nx-schema.config.ts', 'export default [{ schema: "src/schema.ts", outPath: "src/schema.json" }];');
    tree.write('apps/test-app/src/schema.ts', 'import { z } from "zod"; export default z.object({ name: z.string() });');

    await syncSchemasGenerator(tree, {});

    const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
    expect(outOfSyncContent).toContain('Zod schemas are out of sync');
    expect(outOfSyncContent).toContain('Missing schema.json file');
  });

  it('should detect stale schema.json file', async () => {
    // Setup project graph with a project that has both files but content doesn't match
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

    // Mock loadModuleExport function
    const { z } = require('zod');
    const mockLoadFn = vi.fn().mockReturnValue(z.object({ name: z.string() }));

    // Create config file, schema.ts with a schema, and stale schema.json
    tree.write('apps/test-app/zod2nx-schema.config.ts', 'export default [{ schema: "src/schema.ts", outPath: "src/schema.json" }];');
    tree.write('apps/test-app/src/schema.ts', 'import { z } from "zod"; export default z.object({ name: z.string() });');
    tree.write('apps/test-app/src/schema.json', '{"type": "object", "properties": { "age": { "type": "number" } }}'); // Different content

    await syncSchemasGenerator(tree, {}, mockLoadFn);

    const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
    expect(outOfSyncContent).toContain('Zod schemas are out of sync');
    expect(outOfSyncContent).toContain('Stale schema.json file');
  });
  it('should skip when no zod2nx-schema.config files exist', async () => {
    // Setup project graph with a project that has no config file
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

    await syncSchemasGenerator(tree, {});

    const outOfSyncContent = tree.read('.out-of-sync.txt', 'utf8');
    expect(outOfSyncContent).toContain('SYNC!!!!');
  });

});