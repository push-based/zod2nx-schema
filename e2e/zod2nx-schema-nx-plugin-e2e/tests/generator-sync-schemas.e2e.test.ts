import { nxTargetProject, setupTestWorkspace } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  teardownTestFolder,
} from '@push-based/test-utils';
import { executeProcess } from '@push-based/zod2nx-schema';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, expect } from 'vitest';

describe('nx-plugin g sync-schemas', () => {
  const project = 'ui';
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'generators-sync-schemas',
  );

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should inform about dry run when used on sync-schemas generator', async () => {
    const cwd = path.join(testFileDir, 'dry-run');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:sync-schemas',
        project,
        '--dryRun',
      ],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );
  });

  it('should --check valid project', async () => {
    const cwd = path.join(testFileDir, 'nx-update');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:sync-schemas',
        project,
        '--skipInstall',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @push-based/zod2nx-schema-nx-plugin:sync-schemas',
    );
    expect(cleanedStdout).toContain('SYNC GENERATOR: 0 issues found');
    expect(cleanedStdout).toContain('WRITING MESSAGE: SYNC!!!!');
    expect(cleanedStdout).toContain('CREATE .out-of-sync.txt');
  });

  it('should --check for missing schema.ts', async () => {
    const cwd = path.join(testFileDir, 'missing-schema-ts');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    // Create a schema.json file without corresponding schema.ts to simulate missing schema.ts
    const fs = await import('node:fs/promises');
    const uiLibPath = path.join(cwd, 'libs', 'ui');
    await fs.mkdir(path.join(uiLibPath, 'src'), { recursive: true });

    // Create a schema.json file that would normally be generated from schema.ts
    const schemaJsonPath = path.join(uiLibPath, 'src', 'schema.json');
    await fs.writeFile(
      schemaJsonPath,
      JSON.stringify(
        {
          $schema: 'http://json-schema.org/schema',
          $id: 'ui',
          title: 'UI Schema',
          type: 'object',
          properties: {},
        },
        null,
        2,
      ),
    );

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:sync-schemas',
        project,
        '--skipInstall',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @push-based/zod2nx-schema-nx-plugin:sync-schemas',
    );
    expect(cleanedStdout).toContain('SYNC GENERATOR: 1 issues found');
    expect(cleanedStdout).toContain(
      'WRITING MESSAGE: Zod schemas are out of sync',
    );
    expect(cleanedStdout).toContain('CREATE .out-of-sync.txt');
  });
});
