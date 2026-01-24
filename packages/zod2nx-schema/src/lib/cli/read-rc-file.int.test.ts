import path from 'node:path';
import { describe, expect } from 'vitest';
import { readRcByPath } from './read-rc-file.js';

describe('readRcByPath', () => {
  const configDirPath = path.join(
    process.cwd(),
    'packages',
    'zod2nx-schema',
    'mocks',
    'fixtures',
    'configs',
  );

  it('should load the configuration', async () => {
    await expect(
      readRcByPath(path.join(configDirPath, 'zod2nx-schema.config.ts')),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schema: expect.any(String),
          options: expect.objectContaining({
            name: expect.any(String),
          }),
        }),
      ]),
    );
  });

  it('should throw if the path is empty', async () => {
    await expect(readRcByPath('')).rejects.toThrow("File '' does not exist");
  });

  it('should throw if the file does not exist', async () => {
    await expect(
      readRcByPath(path.join('non-existent', 'config.file.js')),
    ).rejects.toThrow(/File '.*' does not exist/);
  });

  it('should throw if the configuration is empty', async () => {
    await expect(
      readRcByPath(path.join(configDirPath, 'zod2nx-schema.empty.config.ts')),
    ).rejects.toThrow('Invalid input');
  });

  it('should throw if the configuration is invalid', async () => {
    await expect(
      readRcByPath(path.join(configDirPath, 'zod2nx-schema.invalid.config.ts')),
    ).rejects.toThrow('Invalid');
  });
});
