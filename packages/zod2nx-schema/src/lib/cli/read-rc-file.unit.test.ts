import { MEMFS_VOLUME } from '@push-based/test-utils';
import { vol } from 'memfs';
import { describe, expect, vi } from 'vitest';
import { ZOD2NX_SCHEMA_CONFIG_NAME } from './constant.js';
import { autoloadRc } from './read-rc-file.js';

// mock bundleRequire inside importEsmModule used for fetching config
vi.mock('bundle-require', async () => ({
  bundleRequire: vi
    .fn()
    .mockImplementation((_options: { filepath: string }) => ({
      mod: {
        default: [
          {
            schema: 'some-schema.ts',
            options: {
              name: 'TestSchema',
            },
          },
        ],
      },
    })),
}));

// Note: memfs files are only listed to satisfy a system check, value is used from bundle-require mock
describe('autoloadRc', () => {
  it('prioritise a .ts configuration file', async () => {
    vol.fromJSON(
      {
        [`${ZOD2NX_SCHEMA_CONFIG_NAME}.js`]: '',
        [`${ZOD2NX_SCHEMA_CONFIG_NAME}.mjs`]: '',
        [`${ZOD2NX_SCHEMA_CONFIG_NAME}.ts`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schema: 'some-schema.ts',
          options: expect.objectContaining({ name: 'TestSchema' }),
        }),
      ]),
    );
  });

  it('should prioritise .mjs configuration file over .js', async () => {
    vol.fromJSON(
      {
        [`${ZOD2NX_SCHEMA_CONFIG_NAME}.js`]: '',
        [`${ZOD2NX_SCHEMA_CONFIG_NAME}.mjs`]: '',
      },
      MEMFS_VOLUME,
    );

    await expect(autoloadRc()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schema: 'some-schema.ts',
        }),
      ]),
    );
  });

  it('should load a .js configuration file if no other valid extension exists', async () => {
    vol.fromJSON({ [`${ZOD2NX_SCHEMA_CONFIG_NAME}.js`]: '' }, MEMFS_VOLUME);

    await expect(autoloadRc()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schema: 'some-schema.ts',
        }),
      ]),
    );
  });

  it('should return empty array if no configuration file is present', async () => {
    await expect(autoloadRc()).resolves.toStrictEqual([]);
  });
});
