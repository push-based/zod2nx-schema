import { MEMFS_VOLUME } from '@push-based/test-utils';
import { vol } from 'memfs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRETTIER_CONFIG_FILES, findPrettierConfig } from './prettier.js';

describe('findPrettierConfig', () => {
  it('should return undefined when no config file exists', async () => {
    vol.fromJSON(
      {
        'src/index.ts': 'export {}',
      },
      MEMFS_VOLUME,
    );

    const result = await findPrettierConfig(MEMFS_VOLUME);

    expect(result).toBeUndefined();
  });

  it.each([
    ['.prettierrc', '{ "singleQuote": true }'],
    ['.prettierrc.json', '{ "singleQuote": true }'],
    ['.prettierrc.yml', 'singleQuote: true'],
    ['.prettierrc.yaml', 'singleQuote: true'],
    ['.prettierrc.js', 'module.exports = {}'],
    ['.prettierrc.cjs', 'module.exports = {}'],
    ['.prettierrc.mjs', 'export default {}'],
    ['.prettierrc.ts', 'export default {}'],
    ['prettier.config.js', 'module.exports = {}'],
    ['prettier.config.cjs', 'module.exports = {}'],
    ['prettier.config.mjs', 'export default {}'],
    ['prettier.config.ts', 'export default {}'],
  ])('should find %s file', async (configFile, content) => {
    vol.fromJSON(
      {
        [configFile]: content,
      },
      MEMFS_VOLUME,
    );

    const result = await findPrettierConfig(MEMFS_VOLUME);

    expect(result).toBe(path.join(MEMFS_VOLUME, configFile));
  });

  it('should prioritize .prettierrc over other config files', async () => {
    vol.fromJSON(
      {
        '.prettierrc': '{}',
        '.prettierrc.json': '{}',
        'prettier.config.js': 'module.exports = {}',
      },
      MEMFS_VOLUME,
    );

    const result = await findPrettierConfig(MEMFS_VOLUME);

    // .prettierrc is first in priority list
    expect(result).toBe(path.join(MEMFS_VOLUME, '.prettierrc'));
  });

  it('should find prettier config in package.json', async () => {
    vol.fromJSON(
      {
        'package.json': JSON.stringify({
          name: 'test-project',
          prettier: { singleQuote: true },
        }),
      },
      MEMFS_VOLUME,
    );

    const result = await findPrettierConfig(MEMFS_VOLUME);

    expect(result).toBe(path.join(MEMFS_VOLUME, 'package.json'));
  });

  it('should use process.cwd() as default directory', async () => {
    // process.cwd() is mocked to return MEMFS_VOLUME in fs.mock.ts
    vol.fromJSON(
      {
        '.prettierrc': '{}',
      },
      MEMFS_VOLUME,
    );

    const result = await findPrettierConfig();

    expect(result).toBe(path.join(MEMFS_VOLUME, '.prettierrc'));
  });
});

describe('PRETTIER_CONFIG_FILES', () => {
  it.each([
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.mjs',
    '.prettierrc.ts',
    'prettier.config.js',
    'prettier.config.cjs',
    'prettier.config.mjs',
    'prettier.config.ts',
  ])(
    'should contain %s as a standard prettier config file name',
    configFile => {
      expect(PRETTIER_CONFIG_FILES).toContain(configFile);
    },
  );
});
