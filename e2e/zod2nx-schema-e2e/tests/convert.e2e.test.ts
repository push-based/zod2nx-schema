import { nxTargetProject } from '@push-based/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@push-based/test-utils';
import {
  ZOD2NX_SCHEMA_CONFIG_NAME,
  executeProcess,
} from '@push-based/zod2nx-schema';
import { cp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, expect } from 'vitest';

describe('CLI convert', () => {
  const fixtureDummyDir = path.join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'minimal-setup',
  );
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'convert');

  const schemaName = 'schema';

  beforeAll(async () => {
    await cp(fixtureDummyDir, testFileDir, { recursive: true });
    await restoreNxIgnoredFiles(testFileDir);
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should execute convert command', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/zod2nx-schema',
        'convert',
        path.join('src', `${schemaName}.ts`),
        path.join('src', `args-${schemaName}.json`),
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Converting 1 schema file');

    const output = await readFile(
      path.join(
        process.cwd(),
        envRoot,
        TEST_OUTPUT_DIR,
        'convert',
        'src',
        `args-${schemaName}.json`,
      ),
      'utf8',
    );
    expect(output).toContain(`$schema`);
  });

  it('should execute convert command with config file', async () => {
    const outPath = `src/config-file-${schemaName}.json`;
    const configPath = path.join(
      'config',
      `custom.${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`,
    );
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['@push-based/zod2nx-schema', 'convert', `--config=${configPath}`],
      cwd: testFileDir,
    });

    expect(code).toBe(0);

    expect(stdout).toContain(`custom.${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`);

    const output = await readFile(path.join(testFileDir, outPath), 'utf8');
    expect(JSON.parse(output)).toStrictEqual({
      test: 42,
    });
  });

  it.todo('should execute convert command with config file and fromPkg');
});
