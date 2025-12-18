import { nxTargetProject, setupTestWorkspace } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  teardownTestFolder,
} from '@push-based/test-utils';
import {
  ZOD2NX_SCHEMA_CONFIG_NAME,
  executeProcess,
} from '@push-based/zod2nx-schema';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, expect } from 'vitest';

describe('zod2nx-schema-nx-plugin g configuration', () => {
  const project = 'ui';
  const projectRoot = path.join('libs', project);
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'generators-configuration',
  );

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should generate zod2nx-schema.config.ts file', async () => {
    const cwd = path.join(testFileDir, 'configure');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:configuration',
        project,
        '--targetName=zod2nx-schema',
      ],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).not.toContain(
      `NOTE: No config file created as zod2nx-schema.config.js file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);

    expect(cleanedStdout).toContain(
      'NX  Generating @push-based/zod2nx-schema-nx-plugin:configuration',
    );
    expect(cleanedStdout).toMatch(/^CREATE.*zod2nx-schema.config.ts/m);

    await expect(
      readFile(
        path.join(cwd, 'libs', project, 'zod2nx-schema.config.ts'),
        'utf8',
      ),
    ).resolves.not.toThrow();
  });

  it('should NOT create a zod2nx-schema.config.ts file if one already exists', async () => {
    const cwd = path.join(testFileDir, 'configure-config-existing');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await writeFile(
      path.join(projectRoot, `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`),
      'export default [];',
      'utf8',
    );

    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:configuration',
        project,
      ],
      cwd,
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      `NOTE: No config file created as zod2nx-schema.config.ts file already exists.`,
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      'NX  Generating @push-based/zod2nx-schema-nx-plugin:configuration',
    );
    expect(cleanedStdout).not.toMatch(/^CREATE.*zod2nx-schema.config.ts/m);
  });

  it('should NOT create a zod2nx-schema.config.ts file if skipConfig is given', async () => {
    const cwd = path.join(testFileDir, 'configure-skip-config');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:configuration',
        project,
        '--skipConfig',
      ],
      cwd,
    });

    expect(code).toBe(0);

    const cleanedStdout = removeColorCodes(stdout);

    expect(cleanedStdout).toContain(
      'NX  Generating @push-based/zod2nx-schema-nx-plugin:configuration',
    );
    expect(cleanedStdout).not.toMatch(/^CREATE.*zod2nx-schema.config.ts/m);

    await expect(
      readFile(
        path.join(cwd, 'libs', project, 'zod2nx-schema.config.ts'),
        'utf8',
      ),
    ).rejects.toThrow('no such file or directory');
  });

  it('should inform about dry run', async () => {
    const cwd = path.join(testFileDir, 'configure');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { stderr } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@push-based/zod2nx-schema-nx-plugin:configuration',
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
});
