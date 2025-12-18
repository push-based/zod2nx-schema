import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ParsedGenerateZod2NxSchemaOptions } from '../schema/generate-schema.js';
import { logger } from '../utils/logger.js';

export function isPrintConfigCommand(args: string[]): boolean {
  return args[0] === 'print-config';
}

export async function printConfigCommand(
  opt: ParsedGenerateZod2NxSchemaOptions[],
  o: {
    fromPkg?: string;
    configPath?: string;
    output?: string;
  },
) {
  const { output, configPath, fromPkg } = o;
  const json = {
    fromPkg,
    config: configPath,
    ...opt,
  };
  const jsonOutput = JSON.stringify(json, null, 2);

  if (typeof output === 'string') {
    const dir = path.dirname(output);
    if (dir !== '.') {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(output, jsonOutput);
  } else {
    logger.info(JSON.stringify(json));
  }
}
