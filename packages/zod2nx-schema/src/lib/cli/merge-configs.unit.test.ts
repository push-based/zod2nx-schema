import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { GenerateZod2NxSchemaOptions } from '../schema/generate-schema.js';
import {
  createConfigKey,
  mergeConfigPair,
  mergeConfigs,
} from './merge-configs.js';

describe('createConfigKey', () => {
  it('should create key from schema path and export name', () => {
    const config: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      exportName: 'mySchema',
      options: { name: 'Test' },
    };

    const key = createConfigKey(config);

    expect(key).toMatchPath('/project/src/schema.ts:mySchema');
  });

  it('should use "default" when exportName is undefined', () => {
    const config: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      options: { name: 'Test' },
    };

    const key = createConfigKey(config);

    expect(key).toMatchPath('/project/src/schema.ts:default');
  });

  it('should normalize paths for consistent keys', () => {
    const config1: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      options: { name: 'Test' },
    };
    const config2: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      options: { name: 'Test' },
    };

    expect(createConfigKey(config1)).toBe(createConfigKey(config2));
  });

  it('should resolve relative paths to absolute', () => {
    const config: GenerateZod2NxSchemaOptions = {
      schema: 'src/schema.ts',
      options: { name: 'Test' },
    };

    const key = createConfigKey(config);

    // path.resolve uses process.cwd() for relative paths
    expect(key).toMatchPath(
      `${path.join(process.cwd(), 'src', 'schema.ts')}:default`,
    );
  });
});

describe('mergeConfigPair', () => {
  it('should merge options with incoming taking precedence', () => {
    const existing: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      exportName: 'mySchema',
      outPath: '/project/dist/schema.json',
      options: {
        name: 'OldName',
        title: 'Old Title',
        description: 'Old description',
      },
    };
    const incoming: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      exportName: 'mySchema',
      options: {
        name: 'NewName',
        title: 'New Title',
      },
    };

    const result = mergeConfigPair(existing, incoming);

    expect(result).toEqual({
      schema: '/project/src/schema.ts',
      exportName: 'mySchema',
      outPath: '/project/dist/schema.json',
      options: {
        name: 'NewName',
        title: 'New Title',
        description: 'Old description',
      },
    });
  });

  it('should preserve existing exportName when incoming is undefined', () => {
    const existing: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      exportName: 'mySchema',
      options: { name: 'Test' },
    };
    const incoming: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      options: { name: 'Test' },
    };

    const result = mergeConfigPair(existing, incoming);

    expect(result.exportName).toBe('mySchema');
  });

  it('should use incoming outPath when provided', () => {
    const existing: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      outPath: '/project/old/path.json',
      options: { name: 'Test' },
    };
    const incoming: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      outPath: '/project/new/path.json',
      options: { name: 'Test' },
    };

    const result = mergeConfigPair(existing, incoming);

    expect(result.outPath).toMatchPath('/project/new/path.json');
  });

  it('should preserve existing outPath when incoming is undefined', () => {
    const existing: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      outPath: '/project/existing/path.json',
      options: { name: 'Test' },
    };
    const incoming: GenerateZod2NxSchemaOptions = {
      schema: '/project/src/schema.ts',
      options: { name: 'Test' },
    };

    const result = mergeConfigPair(existing, incoming);

    expect(result.outPath).toMatchPath('/project/existing/path.json');
  });
});

describe('mergeConfigs', () => {
  it('should return empty array for empty input', () => {
    expect(mergeConfigs([])).toEqual([]);
  });

  it('should return single config unchanged', () => {
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: '/project/src/schema.ts',
        options: { name: 'Test' },
      },
    ];

    expect(mergeConfigs(configs)).toEqual(configs);
  });

  it('should return all configs when no duplicates exist', () => {
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: '/project/src/schema1.ts',
        options: { name: 'Test1' },
      },
      {
        schema: '/project/src/schema2.ts',
        options: { name: 'Test2' },
      },
      {
        schema: '/project/src/schema3.ts',
        options: { name: 'Test3' },
      },
    ];

    const result = mergeConfigs(configs);

    expect(result).toHaveLength(3);
  });

  it('should merge configs with same schema path and exportName', () => {
    const schemaPath = '/project/src/schema.ts';
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: schemaPath,
        exportName: 'mySchema',
        outPath: '/project/dist/schema.json',
        options: { name: 'OldName', description: 'Keep this' },
      },
      {
        schema: schemaPath,
        exportName: 'mySchema',
        options: { name: 'NewName', title: 'Add this' },
      },
    ];

    const result = mergeConfigs(configs);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      schema: schemaPath,
      exportName: 'mySchema',
      outPath: '/project/dist/schema.json',
      options: {
        name: 'NewName',
        title: 'Add this',
        description: 'Keep this',
      },
    });
  });

  it('should treat same path with different exportName as separate configs', () => {
    const schemaPath = '/project/src/schema.ts';
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: schemaPath,
        exportName: 'schemaA',
        options: { name: 'SchemaA' },
      },
      {
        schema: schemaPath,
        exportName: 'schemaB',
        options: { name: 'SchemaB' },
      },
    ];

    const result = mergeConfigs(configs);

    expect(result).toHaveLength(2);
  });

  it('should treat undefined exportName as "default"', () => {
    const schemaPath = '/project/src/schema.ts';
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: schemaPath,
        options: { name: 'First', description: 'Keep' },
      },
      {
        schema: schemaPath,
        exportName: 'default',
        options: { name: 'Second' },
      },
    ];

    const result = mergeConfigs(configs);

    expect(result).toHaveLength(1);
    expect(result[0]?.options).toEqual({
      name: 'Second',
      description: 'Keep',
    });
  });

  it('should normalize relative paths when deduplicating', () => {
    // Both resolve to the same absolute path via path.resolve()
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: 'src/schema.ts',
        options: { name: 'First', title: 'Original' },
      },
      {
        schema: path.join(process.cwd(), 'src', 'schema.ts'),
        options: { name: 'Second' },
      },
    ];

    const result = mergeConfigs(configs);

    expect(result).toHaveLength(1);
    expect(result[0]?.options.name).toBe('Second');
    expect(result[0]?.options.title).toBe('Original');
  });

  it('should merge multiple duplicates in order', () => {
    const schemaPath = '/project/src/schema.ts';
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: schemaPath,
        options: { name: 'First', description: 'A' },
      },
      {
        schema: schemaPath,
        options: { name: 'Second', title: 'B' },
      },
      {
        schema: schemaPath,
        options: { name: 'Third' },
      },
    ];

    const result = mergeConfigs(configs);

    expect(result).toHaveLength(1);
    expect(result[0]?.options).toEqual({
      name: 'Third',
      title: 'B',
      description: 'A',
    });
  });

  it('should preserve order of first occurrence for unique configs', () => {
    const configs: GenerateZod2NxSchemaOptions[] = [
      {
        schema: '/project/a.ts',
        options: { name: 'A' },
      },
      {
        schema: '/project/b.ts',
        options: { name: 'B' },
      },
      {
        schema: '/project/a.ts',
        options: { name: 'A2' },
      },
      {
        schema: '/project/c.ts',
        options: { name: 'C' },
      },
    ];

    const result = mergeConfigs(configs);

    expect(result).toHaveLength(3);
    expect(result.map(c => c.options.name)).toEqual(['A2', 'B', 'C']);
  });
});
