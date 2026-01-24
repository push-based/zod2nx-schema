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

  it('should register sync generator locally in project.json', async () => {
    // Create project.json
    tree.write(
      path.join(testProjectRoot, 'project.json'),
      JSON.stringify({
        name: testProjectName,
        targets: {
          build: {},
        },
      }),
    );

    await configurationGenerator(tree, {
      project: testProjectName,
      registerSyncGenerator: true,
      taskName: 'build',
    });

    const projectConfig = readProjectConfiguration(tree, testProjectName);
    expect(projectConfig.targets?.build?.syncGenerators).toContain(
      '@push-based/zod2nx-schema-nx-plugin:sync-schemas',
    );
  });

  it('should register sync generator locally in package.json for inferred targets', async () => {
    // For inferred targets, we need to create a project without project.json
    // First, delete the project.json that was created by addProjectConfiguration
    tree.delete(path.join(testProjectRoot, 'project.json'));

    // Create package.json with nx configuration for inferred targets
    tree.write(
      path.join(testProjectRoot, 'package.json'),
      JSON.stringify({
        name: testProjectName,
        nx: {
          targets: {
            build: {},
          },
        },
      }),
    );

    await configurationGenerator(tree, {
      project: testProjectName,
      registerSyncGenerator: true,
      taskName: 'build',
    });

    const packageJson = JSON.parse(
      tree.read(path.join(testProjectRoot, 'package.json'))!.toString(),
    );
    expect(packageJson.nx).toBeDefined();
    expect(packageJson.nx.targets).toBeDefined();
    expect(packageJson.nx.targets.build.syncGenerators).toContain(
      '@push-based/zod2nx-schema-nx-plugin:sync-schemas',
    );
  });

  it('should not register sync generator when option is false', async () => {
    // Create project.json
    tree.write(
      path.join(testProjectRoot, 'project.json'),
      JSON.stringify({
        name: testProjectName,
        targets: {
          build: {},
        },
      }),
    );

    await configurationGenerator(tree, {
      project: testProjectName,
      registerSyncGeneratorLocally: false,
      taskName: 'build',
    });

    const projectConfig = readProjectConfiguration(tree, testProjectName);
    expect(projectConfig.targets?.build?.syncGenerators).toBeUndefined();
  });
});
