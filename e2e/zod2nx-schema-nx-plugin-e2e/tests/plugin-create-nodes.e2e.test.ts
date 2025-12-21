import {
  nxShowProjectJson,
  nxTargetProject,
  registerPluginInWorkspaceFile,
  setupTestWorkspace,
} from '@push-based/test-nx-utils';
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
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, expect } from 'vitest';

describe('nx-plugin', () => {
  const project = 'ui';
  const projectRoot = path.join('libs', project);
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'plugin-create-nodes',
  );

  // afterEach(async () => {
  //   await teardownTestFolder(testFileDir);
  // });

  it('should add configuration target dynamically', async () => {
    const cwd = path.join(testFileDir, 'add-configuration-dynamically');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(
      cwd,
      '@push-based/zod2nx-schema-nx-plugin',
    );

    const { code, projectJson, error } = await nxShowProjectJson(cwd, project);
    expect(error).toHaveProperty('message', '');
    expect(code).toBe(0);

    expect(projectJson['targets']).toEqual({
      'zod2nx-schema--configuration': {
        configurations: {},
        executor: 'nx:run-commands',
        options: {
          command: `nx g @push-based/zod2nx-schema-nx-plugin:configuration --project="${project}"`,
        },
        parallelism: true,
      },
    });

    expect(projectJson['targets']).toMatchSnapshot();
  });

  it('should execute dynamic configuration target', async () => {
    const cwd = path.join(testFileDir, 'execute-dynamic-configuration');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(cwd, {
      plugin: '@push-based/zod2nx-schema-nx-plugin',
    });

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:zod2nx-schema--configuration`],
      cwd,
    });

    expect(code).toBe(0);

    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain(
      `Successfully ran target zod2nx-schema--configuration for project ${project}`,
    );
  });

  it('should consider plugin option targetName in configuration target', async () => {
    const cwd = path.join(testFileDir, 'configuration-option-target-name');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(cwd, {
      plugin: '@push-based/zod2nx-schema-nx-plugin',
      options: {
        targetName: 'cp',
      },
    });

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson['targets']).toStrictEqual({
      'cp--configuration': expect.any(Object),
    });
  });

  it('should NOT add config targets dynamically if the project is configured', async () => {
    const cwd = path.join(testFileDir, 'configuration-already-configured');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(
      cwd,
      '@push-based/zod2nx-schema-nx-plugin',
    );
    await writeFile(
      path.join(cwd, projectRoot, `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`),
      'export default []',
    );

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson['targets']).toStrictEqual(
      expect.not.objectContaining({
        'zod2nx-schema--configuration': expect.any(Object),
      }),
    );
    expect(projectJson['targets']).toMatchSnapshot();
  });

  it('should add executor target dynamically if the project is configured', async () => {
    const cwd = path.join(testFileDir, 'add-executor-dynamically');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(
      cwd,
      '@push-based/zod2nx-schema-nx-plugin',
    );
    await writeFile(
      path.join(cwd, projectRoot, `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`),
      'export default []',
    );

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson['targets']).toStrictEqual({
      'zod2nx-schema': {
        configurations: {},
        executor: `@push-based/zod2nx-schema-nx-plugin:cli`,
        options: {},
        parallelism: true,
      },
    });

    expect(projectJson['targets']).toMatchSnapshot();
  });

  it('should execute dynamic executor target', async () => {
    const cwd = path.join(testFileDir, 'execute-dynamic-executor');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(cwd, {
      plugin: '@push-based/zod2nx-schema-nx-plugin',
    });
    await writeFile(
      path.join(cwd, projectRoot, `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`),
      'export default []',
    );

    const { stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:zod2nx-schema`, '--dryRun', '--verbose'],
      cwd,
    });

    const cleanStdout = removeColorCodes(stdout);
    // Nx command ran successfully
    expect(cleanStdout).toContain('nx run ui:zod2nx-schema');
    expect(cleanStdout).toContain('Successfully ran target zod2nx-schema');
  });

  it('should consider plugin option bin in executor target', async () => {
    const cwd = path.join(testFileDir, 'executor-option-bin');
    const binPath = `packages/cli/dist`;
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);
    await registerPluginInWorkspaceFile(cwd, {
      plugin: '@push-based/zod2nx-schema-nx-plugin',
      options: {
        bin: binPath,
      },
    });
    await writeFile(
      path.join(cwd, projectRoot, `${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`),
      'export default []',
    );

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson['targets']).toStrictEqual({
      'zod2nx-schema': expect.objectContaining({
        options: {
          bin: binPath,
        },
      }),
    });
  });

  it('should NOT add targets dynamically if plugin is not registered', async () => {
    const cwd = path.join(testFileDir, 'plugin-not-registered');
    const mockDir = path.join(import.meta.dirname, '../mocks/nx-monorepo');
    await setupTestWorkspace(mockDir, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson['targets']).toBeDefined();
    // Without the plugin registered, no dynamic targets should be added
    expect(projectJson['targets']).not.toHaveProperty('zod2nx-schema');
    expect(projectJson['targets']).not.toHaveProperty(
      'zod2nx-schema--configuration',
    );
  });
});
