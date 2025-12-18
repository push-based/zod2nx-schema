import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configurationGenerator } from './generator.js';

describe('configurationGenerator', () => {
  let tree: devKit.Tree;
  const testProjectName = 'test-app';
  const formatFilesSpy = vi.spyOn(devKit, 'formatFiles');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    devKit.addProjectConfiguration(tree, testProjectName, {
      root: 'test-app',
    });
  });

  afterEach(() => {
    formatFilesSpy.mockReset();
  });

  it('should create zod2nx-schema.config.ts file', async () => {
    await configurationGenerator(tree, { project: testProjectName });

    expect(tree.exists('od2nx-schema.config.ts')).toBe(true);
  });

  it('should skip config file creation when skipConfig is true', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipConfig: true,
    });

    expect(tree.exists('od2nx-schema.config.ts')).toBe(false);
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
