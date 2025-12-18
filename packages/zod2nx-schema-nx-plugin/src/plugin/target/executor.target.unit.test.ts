import { describe, expect, it } from 'vitest';
import { createExecutorTarget } from './executor-target.js';

describe('createExecutorTarget', () => {
  it('should return executor target without project name', () => {
    expect(createExecutorTarget()).toStrictEqual({
      executor: '@push-based/zod2nx-schema-nx-plugin:cli',
    });
  });

  it('should use bin if provided', () => {
    expect(
      createExecutorTarget({ bin: 'packages/cli/src/index.ts' }),
    ).toStrictEqual({
      executor: '@push-based/zod2nx-schema-nx-plugin:cli',
      options: {
        bin: 'packages/cli/src/index.ts',
      },
    });
  });

  it('should use projectPrefix if provided', () => {
    expect(createExecutorTarget({ projectPrefix: 'cli' })).toStrictEqual({
      executor: '@push-based/zod2nx-schema-nx-plugin:cli',
      options: {
        projectPrefix: 'cli',
      },
    });
  });
});
