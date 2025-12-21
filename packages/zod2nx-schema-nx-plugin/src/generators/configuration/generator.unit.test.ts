import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configurationGenerator } from './generator.js';

describe('configurationGenerator', () => {
  let tree: devKit.Tree;
  const testProjectName = 'test-app';
  const testProjectRoot = 'test-app';
  const configPath = `${testProjectRoot}/zod2nx-schema.config.ts`;
  const formatFilesSpy = vi.spyOn(devKit, 'formatFiles');
  const loggerWarnSpy = vi.spyOn(devKit.logger, 'warn');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    devKit.addProjectConfiguration(tree, testProjectName, {
      root: testProjectRoot,
    });
  });

  afterEach(() => {
    formatFilesSpy.mockReset();
    loggerWarnSpy.mockReset();
  });

  it('should create zod2nx-schema.config.ts file in project root', async () => {
    await configurationGenerator(tree, { project: testProjectName });

    expect(tree.exists(configPath)).toBe(true);
  });

  it('should skip config file creation when skipConfig is true', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipConfig: true,
    });

    expect(tree.exists(configPath)).toBe(false);
  });

  it('should not overwrite existing config file', async () => {
    tree.write(configPath, 'existing content');

    await configurationGenerator(tree, { project: testProjectName });

    expect(tree.read(configPath, 'utf8')).toBe('existing content');
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'NOTE: No config file created as zod2nx-schema.config.ts file already exists.',
    );
  });

  it('should format files by default', async () => {
    await configurationGenerator(tree, { project: testProjectName });

    expect(formatFilesSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip formatting when skipFormat is true', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipFormat: true,
    });

    expect(formatFilesSpy).not.toHaveBeenCalled();
  });
});
