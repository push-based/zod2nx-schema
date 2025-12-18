import { osAgnosticPath } from '@push-based/test-utils';
import { describe, expect } from 'vitest';
import { globalConfig } from './config.js';

describe('globalConfig', () => {
  it('should provide default global verbose options', () => {
    expect(
      globalConfig(
        {},
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ verbose: false }));
  });

  it('should parse global verbose options', () => {
    expect(
      globalConfig(
        { verbose: true },
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ verbose: true }));
  });

  it('should provide default global config options', () => {
    const { config } = globalConfig(
      {},
      {
        workspaceRoot: '/test/root/workspace-root',
        projectConfig: {
          name: 'my-app',
          root: 'packages/project-root',
        },
      },
    );
    expect(osAgnosticPath(String(config))).toStrictEqual(
      expect.stringContaining(
        osAgnosticPath('project-root/zod2nx-schema.config.ts'),
      ),
    );
  });

  it('should parse global config options', () => {
    expect(
      globalConfig(
        { config: 'my.config.ts' },
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.objectContaining({ config: 'my.config.ts' }));
  });

  it('should work with empty projectConfig', () => {
    expect(
      globalConfig(
        {},
        {
          workspaceRoot: '/test/root/workspace-root',
        },
      ),
    ).toEqual(expect.objectContaining({ config: 'zod2nx-schema.config.ts' }));
  });

  it('should exclude other options', () => {
    expect(
      globalConfig(
        { test: 42, verbose: true },
        {
          workspaceRoot: '/test/root/workspace-root',
          projectConfig: {
            name: 'my-app',
            root: 'packages/project-root',
          },
        },
      ),
    ).toEqual(expect.not.objectContaining({ test: expect.anything() }));
  });
});
