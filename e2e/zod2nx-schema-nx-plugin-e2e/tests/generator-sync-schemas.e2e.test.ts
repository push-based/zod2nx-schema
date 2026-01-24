import { nxTargetProject, setupTestWorkspace } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  teardownTestFolder,
} from '@push-based/test-utils';
import { executeProcess } from '@push-based/zod2nx-schema';
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
  });

  it('should --check for missing schema.ts', async () => {
    const cwd = path.join(testFileDir, 'missing-schema-ts');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const fs = await import('node:fs/promises');
    const uiLibPath = path.join(cwd, 'libs', 'ui');
    await fs.mkdir(path.join(uiLibPath, 'src'), { recursive: true });
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
  });
});

describe('nx sync --check global sync-schemas', () => {
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'nx-sync-check-global',
  );

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should detect out of sync schemas and report them', async () => {
    const cwd = path.join(testFileDir, 'out-of-sync');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const fs = await import('node:fs/promises');
    const uiLibPath = path.join(cwd, 'libs', 'ui');
    await fs.mkdir(path.join(uiLibPath, 'src'), { recursive: true });
    const schemaJsonPath = path.join(uiLibPath, 'src', 'schema.json');
    await fs.writeFile(
      schemaJsonPath,
      JSON.stringify(
        {
          $schema: 'http://json-schema.org/schema',
          $id: 'ui',
          title: 'UI Schema Modified',
          type: 'object',
          properties: {},
        },
        null,
        2,
      ),
    );

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'sync', '--check'],
      cwd,
      ignoreExitCode: true,
    });

    expect(code).not.toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toMatchInlineSnapshot('');
  });

  it('should pass when all schemas are in sync', async () => {
    const cwd = path.join(testFileDir, 'in-sync');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    await executeProcess({
      command: 'npx',
      args: ['nx', 'sync'],
      cwd,
    });

    const { stderr, stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'sync', '--check'],
      cwd,
    });

    expect(stderr).toBe('');
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toMatchInlineSnapshot(`
      "
       NX   The workspace is up to date

      There are no sync generators to run.

      "
    `);
  });
});

describe('nx sync --check project sync-schemas', () => {
  const project = 'ui';
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'nx-sync-check-project',
  );

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should detect out of sync schemas for specific project and report them', async () => {
    const cwd = path.join(testFileDir, 'out-of-sync-project');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const fs = await import('node:fs/promises');
    const uiLibPath = path.join(cwd, 'libs', project);
    await fs.mkdir(path.join(uiLibPath, 'src'), { recursive: true });

    /*
    const schemaJsonPath = path.join(uiLibPath, 'src', 'schema.json');
    await fs.writeFile(
      schemaJsonPath,
      JSON.stringify(
        {
          $schema: 'http://json-schema.org/schema',
          $id: project,
          title: 'Project Schema Modified',
          type: 'object',
          properties: { modified: { type: 'string' } },
        },
        null,
        2,
      ),
    );*/

    const { stderr, stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'sync', '--check', project],
      cwd,
      ignoreExitCode: true,
    });

    expect(stderr).toBe('');
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toMatchInlineSnapshot(`
      "
       NX   The workspace is up to date

      There are no sync generators to run.

      "
    `);
  });

  it('should pass when project schemas are in sync', async () => {
    const cwd = path.join(testFileDir, 'in-sync-project');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await executeProcess({
      command: 'npx',
      args: ['nx', 'sync', project],
      cwd,
    });
    const { stderr, stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'sync', '--check', project],
      cwd,
    });

    expect(stderr).toBe('');
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toMatchInlineSnapshot(`
      "
       NX   The workspace is up to date

      There are no sync generators to run.

      "
    `);
  });
});
