import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { logger } from './logger.js';
import {
  detectPrettier,
  formatWithPrettier,
  isPrettierAvailable,
  tryFormatWithPrettier,
} from './prettier.js';

// All integration tests run under the tmp folder, isolated from the project root
const TEST_OUTPUT_BASE = path.join(
  process.cwd(),
  'tmp',
  'int-test',
  'zod2nx-schema',
  '.prettier-test-output',
);

describe('isPrettierAvailable', () => {
  const tempDir = path.join(TEST_OUTPUT_BASE, 'available');

  beforeAll(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should return true when prettier is installed', async () => {
    // prettier is installed in the workspace and resolvable from tempDir
    const result = await isPrettierAvailable(tempDir);

    expect(result).toBe(true);
  });
});

describe('detectPrettier', () => {
  const tempDir = path.join(TEST_OUTPUT_BASE, 'detect');

  beforeAll(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should detect prettier availability and config when config exists', async () => {
    // Create a .prettierrc file in tempDir
    await writeFile(path.join(tempDir, '.prettierrc'), '{}', 'utf8');

    const result = await detectPrettier({ cwd: tempDir });

    expect(result.isAvailable).toBe(true);
    expect(result.configPath).toContain('.prettierrc');
  });

  it('should detect prettier config from parent directories', async () => {
    // Prettier searches up the directory tree and finds the project root config
    const result = await detectPrettier({ cwd: tempDir });

    expect(result.isAvailable).toBe(true);
    // Config is found from parent directory (project root)
    expect(result.configPath).toContain('.prettierrc');
  });
});

describe('formatWithPrettier', () => {
  const tempDir = path.join(TEST_OUTPUT_BASE, 'format');
  const testFilePath = path.join(tempDir, 'test.json');

  beforeAll(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it(
    'should format a JSON file without throwing',
    {
      timeout: 10000,
    },
    async () => {
      // Write a valid JSON file
      const jsonContent = '{"name": "test", "version": "1.0.0"}';
      await writeFile(testFilePath, jsonContent, 'utf8');

      // Should complete without throwing
      await expect(
        formatWithPrettier([testFilePath], { cwd: tempDir, silent: true }),
      ).resolves.toBeUndefined();
    },
  );

  it(
    'should format a TypeScript file with correct spacing',
    { timeout: 10000 },
    async () => {
      // TypeScript with inconsistent formatting
      const tsFilePath = path.join(tempDir, 'test.ts');
      const unformattedTs = `const x=1;const y='hello';`;
      await writeFile(tsFilePath, unformattedTs, 'utf8');

      await formatWithPrettier([tsFilePath], {
        cwd: tempDir,
        silent: true,
      });

      const { readTextFile } = await import('./file-system.js');
      const formattedContent = await readTextFile(tsFilePath);

      // Prettier should add spaces around assignments and use single quotes
      expect(formattedContent).toContain('const x = 1');
      expect(formattedContent).toContain("const y = 'hello'");
    },
  );

  it('should do nothing when file paths array is empty', async () => {
    // Should not throw
    await expect(
      formatWithPrettier([], { silent: true }),
    ).resolves.toBeUndefined();
  });

  it('should log formatted files via logger.task', async () => {
    const loggerTaskSpy = vi.spyOn(logger, 'task');
    const testFile = path.join(tempDir, 'log-test.json');
    await writeFile(testFile, '{}', 'utf8');

    await formatWithPrettier([testFile], { cwd: tempDir });

    expect(loggerTaskSpy).toHaveBeenCalledWith(
      expect.stringContaining('Formatting 1 file'),
      expect.any(Function),
    );

    loggerTaskSpy.mockRestore();
  });
});

describe('tryFormatWithPrettier', () => {
  const tempDir = path.join(TEST_OUTPUT_BASE, 'try-format');
  const testFilePath = path.join(tempDir, 'test.json');

  beforeAll(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should return true when formatting succeeds', async () => {
    await writeFile(testFilePath, '{"key":"value"}', 'utf8');

    const result = await tryFormatWithPrettier([testFilePath], {
      cwd: tempDir,
      silent: true,
    });

    expect(result).toBe(true);
  });

  it('should return true for empty file paths array', async () => {
    const result = await tryFormatWithPrettier([], { silent: true });

    expect(result).toBe(true);
  });

  it('should return false when prettier fails on invalid file', async () => {
    const nonExistentFile = path.join(tempDir, 'does-not-exist.json');

    const result = await tryFormatWithPrettier([nonExistentFile], {
      cwd: tempDir,
      silent: true,
    });

    expect(result).toBe(false);
  });
});
