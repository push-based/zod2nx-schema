import { logger } from '@nx/devkit';
import { executorContext } from '@push-based/test-nx-utils';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import * as executeProcessModule from '@push-based/zod2nx-schema';
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';
import runCliExecutor from './executor.js';

describe('runCliExecutor', () => {
  const processEnvCP = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('CP_')),
  );
  const loggerInfoSpy = vi.spyOn(logger, 'info');
  const loggerWarnSpy = vi.spyOn(logger, 'warn');
  const executeProcessSpy = vi.spyOn(executeProcessModule, 'executeProcess');

  beforeAll(() => {
    Object.entries(process.env)
      .filter(([k]) => k.startsWith('CP_'))
      .forEach(([k]) => Reflect.deleteProperty(process.env, k));
  });

  afterAll(() => {
    Object.entries(processEnvCP).forEach(([k, v]) =>
      Reflect.set(process.env, k, v),
    );
  });

  beforeEach(() => {
    vi.unstubAllEnvs();
    executeProcessSpy.mockResolvedValue({
      bin: 'npx ...',
      code: 0,
      signal: null,
      stdout: '',
      stderr: '',
    });
  });

  afterEach(() => {
    loggerWarnSpy.mockReset();
    loggerInfoSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should call executeProcess with return result', async () => {
    const output = await runCliExecutor({}, executorContext('utils'));
    expect(output.success).toBe(true);
    expect(output.command).toMatch('npx @push-based/zod2nx-schema');
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'npx',
      args: expect.arrayContaining(['@push-based/zod2nx-schema']),
      cwd: MEMFS_VOLUME,
    });
  });

  it('should normalize context', async () => {
    const output = await runCliExecutor(
      {},
      {
        ...executorContext('utils'),
        cwd: 'cwd-form-context',
      },
    );
    expect(output.success).toBe(true);
    expect(output.command).toMatch('utils');
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'npx',
      args: expect.arrayContaining(['@push-based/zod2nx-schema']),
      cwd: 'cwd-form-context',
    });
  });

  it('should process executorOptions', async () => {
    const output = await runCliExecutor(
      { config: 'zod2nx-schema.config.json' },
      executorContext('testing-utils'),
    );
    expect(output.success).toBe(true);
    expect(output.command).toContain('--config="zod2nx-schema.config.json"');
  });

  it('should log information if verbose is set', async () => {
    const output = await runCliExecutor(
      { verbose: true },
      { ...executorContext('github-action'), cwd: '<CWD>' },
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);

    expect(output.command).toMatch('--verbose');
    expect(loggerWarnSpy).toHaveBeenCalledTimes(0);
    expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Run CLI executor`),
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Command:'),
    );
  });

  it('should log command if dryRun is set', async () => {
    await runCliExecutor({ dryRun: true }, executorContext('utils'));

    expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('DryRun execution of'),
    );
  });
});
