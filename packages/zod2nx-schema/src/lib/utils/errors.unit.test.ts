import ansis from 'ansis';
import path from 'node:path';
import { z } from 'zod';
import {
  MissingSchemaFilesError,
  SchemaValidationError,
  stringifyError,
} from './errors.js';

describe('MissingSchemaFilesError', () => {
  it('should list missing files with relative paths', () => {
    const cwd = process.cwd();
    const missingFiles = [
      path.join(cwd, 'src/generators/foo/schema.ts'),
      path.join(cwd, 'src/generators/bar/schema.ts'),
    ];

    const error = new MissingSchemaFilesError(missingFiles);

    expect(error.name).toBe('MissingSchemaFilesError');
    expect(error.message).toBe(`Missing schema files:
  - src/generators/foo/schema.ts
  - src/generators/bar/schema.ts

Create these files manually.`);
    expect(error.missingFiles).toEqual(missingFiles);
  });

  it('should preserve original cause when provided', () => {
    const cause = new Error('Original import error');
    const missingFiles = ['/some/path/schema.ts'];

    const error = new MissingSchemaFilesError(missingFiles, cause);

    expect(error.cause).toBe(cause);
  });

  it('should handle single missing file', () => {
    const cwd = process.cwd();
    const missingFiles = [path.join(cwd, 'src/schema.ts')];

    const error = new MissingSchemaFilesError(missingFiles);
    expect(error.message).toContain(`Missing schema files:`);
    expect(error.message).toBe(`schema.ts`);
    expect(error.message).toBe(`Create these files manually.`);
  });
});

describe('stringifyError', () => {
  it('should use only message from plain Error instance', () => {
    expect(stringifyError(new Error('something went wrong'))).toBe(
      'something went wrong',
    );
  });

  it('should use class name and message from Error extensions', () => {
    expect(stringifyError(new TypeError('invalid value'))).toBe(
      'TypeError: invalid value',
    );
  });

  it('should keep strings "as is"', () => {
    expect(stringifyError('something went wrong')).toBe('something went wrong');
  });

  it('should format objects as JSON', () => {
    expect(stringifyError({ status: 400, statusText: 'Bad Request' })).toBe(
      '{"status":400,"statusText":"Bad Request"}',
    );
  });

  it('should truncate multiline error messages if one-liner requested', () => {
    expect(
      stringifyError(
        new Error(
          'Failed to execute 2 out of 5 plugins:\n- ESLint\n- Lighthouse',
        ),
        { oneline: true },
      ),
    ).toBe('Failed to execute 2 out of 5 plugins: […]');
  });

  it('should prettify ZodError instances spanning multiple lines', () => {
    const schema = z.object({
      name: z.string().min(1),
      address: z.string(),
      dateOfBirth: z.iso.date().optional(),
    });
    const { error } = schema.safeParse({ name: '', dateOfBirth: '' });

    expect(stringifyError(error)).toBe(`ZodError:
✖ Too small: expected string to have >=1 characters
  → at name
✖ Invalid input: expected string, received undefined
  → at address
✖ Invalid ISO date
  → at dateOfBirth
`);
  });

  it('should omit multiline ZodError message if one-liner requested', () => {
    const schema = z.object({
      name: z.string().min(1),
      address: z.string(),
      dateOfBirth: z.iso.date().optional(),
    });
    const { error } = schema.safeParse({ name: '', dateOfBirth: '' });

    expect(stringifyError(error, { oneline: true })).toBe('ZodError […]');
  });

  it('should prettify ZodError instances on one line if possible', () => {
    const schema = z.enum(['json', 'md']);
    const { error } = schema.safeParse('html');

    expect(stringifyError(error)).toBe(
      'ZodError: ✖ Invalid option: expected one of "json"|"md"',
    );
  });

  it('should use custom SchemaValidationError formatted messages', () => {
    const schema = z
      .object({
        name: z.string().min(1),
        address: z.string(),
        dateOfBirth: z.iso.date().optional(),
      })
      .meta({ title: 'User' });
    const { error } = schema.safeParse({ name: '', dateOfBirth: '' });

    expect(stringifyError(new SchemaValidationError(error!, schema, {})))
      .toBe(`SchemaValidationError: Invalid ${ansis.bold('User')}
✖ Too small: expected string to have >=1 characters
  → at name
✖ Invalid input: expected string, received undefined
  → at address
✖ Invalid ISO date
  → at dateOfBirth
`);
  });

  it('should truncate SchemaValidationError if one-liner requested', () => {
    const schema = z
      .object({
        name: z.string().min(1),
        address: z.string(),
        dateOfBirth: z.iso.date().optional(),
      })
      .meta({ title: 'User' });
    const { error } = schema.safeParse({ name: '', dateOfBirth: '' });

    expect(
      stringifyError(new SchemaValidationError(error!, schema, {}), {
        oneline: true,
      }),
    ).toBe(`SchemaValidationError: Invalid ${ansis.bold('User')} […]`);
  });
});
