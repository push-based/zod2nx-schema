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
import * as process from 'node:process';
import { beforeAll, expect } from 'vitest';

describe('CLI print-config', () => {
  const extensions = ['js', 'mjs', 'ts'] as const;
  const fixtureDummyDir = path.join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'minimal-setup',
  );

  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'print-config');

  const configFilePath = (ext: (typeof extensions)[number] | 'json') =>
    path.join(
      process.cwd(),
      testFileDir,
      'config',
      `${ZOD2NX_SCHEMA_CONFIG_NAME}.${ext}`,
    );

  beforeAll(async () => {
    await cp(fixtureDummyDir, testFileDir, { recursive: true });
    await restoreNxIgnoredFiles(testFileDir);
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it.each(extensions)(
    'should load .%s config file with correct arguments',
    async ext => {
      const { code, stdout } = await executeProcess({
        command: 'npx',
        args: [
          '@push-based/zod2nx-schema',
          'print-config',
          `--config=${configFilePath(ext)}`,
          `--output`,
          path.join(
            TEST_OUTPUT_DIR,
            'print-config',
            'config',
            `${ext}-${ZOD2NX_SCHEMA_CONFIG_NAME}.json`,
          ),
        ],
        cwd: envRoot,
      });

      expect(code).toBe(0);
      expect(stdout).toContain(`${ZOD2NX_SCHEMA_CONFIG_NAME}.${ext}`);

      const output = await readFile(
        path.join(
          process.cwd(),
          testFileDir,
          'config',
          `${ext}-${ZOD2NX_SCHEMA_CONFIG_NAME}.json`,
        ),
        'utf8',
      );
      expect(JSON.parse(output)).toStrictEqual({
        config: expect.pathToEndWith(`${ZOD2NX_SCHEMA_CONFIG_NAME}.${ext}`),
      });
    },
  );
});
