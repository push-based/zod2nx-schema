import {
  nxTargetProject,
  registerPluginInWorkspaceFile,
  setupTestWorkspace,
} from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
} from '@push-based/test-utils';
import {
  ZOD2NX_SCHEMA_CONFIG_NAME,
  executeProcess,
} from '@push-based/zod2nx-schema';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, expect } from 'vitest';

async function addTargetToWorkspace(options: {
  cwd: string;
  project: string;
}): Promise<void> {
  const { cwd, project } = options;
  const projectRoot = path.join(cwd, 'libs', project);

  await writeFile(
    path.join(projectRoot, `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`),
    'export default [];',
    'utf8',
  );
}

describe('nx plugin executor - cli', () => {
  const project = 'ui';
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'executor-cli');
  const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
  const processEnvCP = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('CP_')),
  );

  beforeAll(() => {
    Object.entries(process.env)
      .filter(([k]) => k.startsWith('CP_'))
      .forEach(([k]) => {
        // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-dynamic-delete
        delete process.env[k];
      });
  });

  // afterEach(async () => {
  //   await teardownTestFolder(testFileDir);
  // });

  afterAll(() => {
    Object.entries(processEnvCP).forEach(([k, v]) => {
      // eslint-disable-next-line functional/immutable-data
      process.env[k] = v;
    });
  });

  it('should execute no specific command by default', async () => {
    const cwd = path.join(testFileDir, 'execute-default-command');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(
      cwd,
      '@push-based/zod2nx-schema-nx-plugin',
    );
    await addTargetToWorkspace({ cwd, project });
    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:zod2nx-schema`, '--dryRun'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run ui:zod2nx-schema');
  });

  it('should execute print-config executor', async () => {
    const cwd = path.join(testFileDir, 'execute-print-config-command');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(
      cwd,
      '@push-based/zod2nx-schema-nx-plugin',
    );
    await addTargetToWorkspace({ cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'run',
        `${project}:zod2nx-schema`,
        'print-config',
        '--output=config.json',
        '--dryRun',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run ui:zod2nx-schema print-config');
  });

  it('should execute print-config executor with output', async () => {
    const cwd = path.join(testFileDir, 'execute-print-config-command-output');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(
      cwd,
      '@push-based/zod2nx-schema-nx-plugin',
    );
    await addTargetToWorkspace({ cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'run',
        `${project}:zod2nx-schema`,
        'print-config',
        '--output=zod2nx-schema.config.json',
        '--dryRun',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run ui:zod2nx-schema print-config');
  });

  it('should execute cli executor and merge target and command-line options', async () => {
    const cwd = path.join(testFileDir, 'execute-cli-with-merged-options');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(
      cwd,
      '@push-based/zod2nx-schema-nx-plugin',
    );
    await addTargetToWorkspace({ cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'run',
        `${project}:zod2nx-schema`,
        'print-config',
        '--config=config.json',
        '--dryRun',
      ],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain(
      'nx run ui:zod2nx-schema print-config --config=config.json',
    );
  });
});
