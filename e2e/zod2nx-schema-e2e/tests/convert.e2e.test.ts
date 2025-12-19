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

  const configFilePath = (name: string) =>
    path.join(process.cwd(), testFileDir, 'config', name);

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
        path.join(TEST_OUTPUT_DIR, 'convert', 'src', `${schemaName}.ts`),
        path.join(TEST_OUTPUT_DIR, 'convert', 'src', `args-${schemaName}.json`),
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stdout).toContain('Converting 1 schema file');

    const output = await readFile(
      path.join(testFileDir, 'src', `args-${schemaName}.json`),
      'utf8',
    );
    expect(output).toContain(`$schema`);
  });

  it('should execute convert command with config file', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: [
        '@push-based/zod2nx-schema',
        'convert',
        `--config=${configFilePath(`custom.${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`)}`,
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);

    expect(stdout).toContain(`custom.${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`);

    const output = await readFile(
      path.join(
        process.cwd(),
        testFileDir,
        'src',
        `config-file-${schemaName}.json`,
      ),
      'utf8',
    );
    expect(JSON.parse(output)).toStrictEqual({
      $id: 'ExampleSchemaFromConfig',
      $schema: 'http://json-schema.org/schema',
      additionalProperties: true,
      properties: {
        key: {
          type: 'string',
        },
      },
      required: ['key'],
      title: 'Example Schema defined config file',
      type: 'object',
    });
  });

  it.todo('should execute convert command with config file and fromPkg');
});
