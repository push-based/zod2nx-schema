import {
  type Tree,
  addProjectConfiguration,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configurationGenerator } from './generator.js';

describe('configurationGenerator', () => {
  let tree: Tree;
  const testProjectName = 'test-app';
  const testProjectRoot = 'test-app';
  const loggerInfoSpy = vi.spyOn(logger, 'info');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, testProjectName, {
      root: testProjectRoot,
    });
  });

  afterEach(() => {
    tree.delete(testProjectRoot);
  });

  it('should skip config creation if skipConfig is used', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipConfig: true,
    });

    readProjectConfiguration(tree, testProjectName);

    expect(
      tree.read(path.join(testProjectRoot, 'zod2nx-schema.config.ts')),
    ).toBeNull();
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip config file creation');
  });

  it('should skip formatting', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipFormat: true,
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip formatting files');
  });
});
