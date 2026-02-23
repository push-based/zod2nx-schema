import ansis from 'ansis';
import path from 'node:path';
import { ZodError, ZodType, z } from 'zod';
import { UNICODE_ELLIPSIS, truncateMultilineText } from './formatting.js';

type SchemaValidationContext = {
  filePath?: string;
};

export class MissingSchemaFilesError extends Error {
  public readonly missingFiles: string[];

  constructor(missingFiles: string[], cause?: Error) {
    const relativePaths = missingFiles.map(f =>
      path.relative(process.cwd(), f),
    );
    const filesList = relativePaths.map(f => `  - ${f}`).join('\n');
    const message = `Missing schema files:\n${filesList}\n\nCreate these files manually.`;

    super(message, { cause });
    this.name = MissingSchemaFilesError.name;
    this.missingFiles = missingFiles;
  }
}

export class SchemaValidationError extends Error {
  constructor(
    error: ZodError,
    schema: ZodType,
    { filePath }: SchemaValidationContext,
  ) {
    const formattedError = z.prettifyError(error);
    const schemaTitle = z.globalRegistry.get(schema)?.title;
    const summary = [
      'Invalid',
      schemaTitle ? ansis.bold(schemaTitle) : 'data',
      filePath &&
        `in ${ansis.bold(path.relative(process.cwd(), filePath))} file`,
    ]
      .filter(Boolean)
      .join(' ');
    super(`${summary}\n${formattedError}\n`);
    this.name = SchemaValidationError.name;
  }
}

export function stringifyError(
  error: unknown,
  format?: { oneline: boolean },
): string {
  const truncate = (text: string) =>
    format?.oneline ? truncateMultilineText(text) : text;

  if (error instanceof ZodError) {
    const formattedError = z.prettifyError(error);
    if (formattedError.includes('\n')) {
      if (format?.oneline) {
        return `${error.name} [${UNICODE_ELLIPSIS}]`;
      }
      return `${error.name}:\n${formattedError}\n`;
    }
    return `${error.name}: ${formattedError}`;
  }

  if (error instanceof Error) {
    if (error.name === 'Error' || error.message.startsWith(error.name)) {
      return truncate(error.message);
    }
    return truncate(`${error.name}: ${error.message}`);
  }
  if (typeof error === 'string') {
    return truncate(error);
  }
  return JSON.stringify(error);
}
