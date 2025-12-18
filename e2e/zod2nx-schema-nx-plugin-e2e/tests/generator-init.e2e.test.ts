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

describe('nx-plugin g init', () => {
  const project = 'ui';
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'generators-init',
  );

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should inform about dry run when used on init generator', async () => {
    const cwd = path.join(testFileDir, 'dry-run');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:init',
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

  it('should update packages.json and configure nx.json', async () => {
    const cwd = path.join(testFileDir, 'nx-update');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:init',
        project,
        '--skipInstall',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @push-based/zod2nx-schema-nx-plugin:init',
    );
    expect(cleanedStdout).toMatch(/^UPDATE package.json/m);
    expect(cleanedStdout).toMatch(/^UPDATE nx.json/m);

    const packageJson = await readFile(path.join(cwd, 'package.json'), 'utf8');
    const nxJson = await readFile(path.join(cwd, 'nx.json'), 'utf8');

    expect(JSON.parse(packageJson)).toStrictEqual(
      expect.objectContaining({
        devDependencies: expect.objectContaining({
          '@push-based/zod2nx-schema-nx-plugin': expect.any(String),
          '@push-based/zod2nx-schema': expect.any(String),
        }),
      }),
    );
    expect(JSON.parse(nxJson)).toStrictEqual(
      expect.objectContaining({
        targetDefaults: expect.objectContaining({
          'zod2nx-schema': {
            cache: true,
            inputs: ['default', '^production'],
          },
        }),
      }),
    );
  });

  it('should skip packages.json update if --skipPackageJson is given', async () => {
    const cwd = path.join(testFileDir, 'skip-packages');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:init',
        project,
        '--skipInstall',
        '--skipPackageJson',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @push-based/zod2nx-schema-nx-plugin:init',
    );
    expect(cleanedStdout).not.toMatch(/^UPDATE package.json/m);
    expect(cleanedStdout).toMatch(/^UPDATE nx.json/m);

    const packageJson = await readFile(path.join(cwd, 'package.json'), 'utf8');
    const nxJson = await readFile(path.join(cwd, 'nx.json'), 'utf8');

    expect(JSON.parse(packageJson)).toStrictEqual(
      expect.objectContaining({
        devDependencies: expect.not.objectContaining({
          '@push-based/zod2nx-schema-nx-plugin': expect.any(String),
          '@push-based/zod2nx-schema': expect.any(String),
        }),
      }),
    );
    expect(JSON.parse(nxJson)).toStrictEqual(
      expect.objectContaining({
        targetDefaults: expect.objectContaining({
          'zod2nx-schema': {
            cache: true,
            inputs: ['default', '^production'],
          },
        }),
      }),
    );
  });
});
