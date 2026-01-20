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

  it('should --check for missing schema.ts', async () => {
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
      '[@push-based/zod2nx-schema-nx-plugin:sync-schemas]: Missing sds',
    );
  });

});
