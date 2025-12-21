# @push-based/zod2nx-schema

A TypeScript library and CLI tool that converts Zod schemas to Nx executor/generator `schema.json` files. This tool leverages Zod's built-in `toJSONSchema` method and adds Nx-specific features like `$default` for argv parameters.

## Features

- ✅ Converts Zod schemas to JSON Schema (draft-07) compatible with Nx executors and generators
- ✅ CLI tool for build-time schema generation
- ✅ TypeScript API for programmatic usage
- ✅ Auto-derives schemas from Nx plugin `package.json`
- ✅ Prettier formatting for generated files
- ✅ Multiple schema generation in a single run

## Installation

```bash
npm install @push-based/zod2nx-schema
```

## Quick Start

### CLI Usage

```bash
# Auto-derive output filename (./src/schema.ts → ./src/schema.json)
npx zod2nx-schema convert ./src/schema.ts

# Explicit output path
npx zod2nx-schema convert ./src/schema.ts ./dist/executor-schema.json

# With named export (schema name is automatically derived)
npx zod2nx-schema convert ./src/schema.ts --exportName myExecutorOptions

# Auto-derive from Nx plugin package.json (reads executors.json and generators.json)
npx zod2nx-schema convert --fromPkg ./packages/my-plugin/package.json
```

## CLI Commands

### `convert` (default)

Converts Zod schemas to Nx schema JSON files.

```bash
# Explicit command
npx zod2nx-schema convert ./src/schema.ts

# Implicit (convert is the default command)
npx zod2nx-schema ./src/schema.ts ./output/schema.json
```

### `print-config`

Prints the resolved configuration to stdout or a file.

```bash
# Print to stdout
npx zod2nx-schema print-config --config=./zod2nx-schema.config.ts

# Print to file
npx zod2nx-schema print-config --config=./zod2nx-schema.config.ts --output=./resolved-config.json
```

### `help`

Displays help information.

```bash
npx zod2nx-schema help
npx zod2nx-schema --help
npx zod2nx-schema -h
```

## CLI Options

| Option                | Type      | Description                                                                          |
| --------------------- | --------- | ------------------------------------------------------------------------------------ |
| `--fromPkg <path>`    | `string`  | Path to Nx plugin `package.json` for auto-deriving schemas from executors/generators |
| `--config <path>`     | `string`  | Path to a configuration file (auto-detected if not provided)                         |
| `--tsconfig <path>`   | `string`  | Path to TypeScript configuration for resolving config files                          |
| `--exportName <name>` | `string`  | Name of the export in the schema module (default: `'default'`)                       |
| `--skipFormat`        | `boolean` | Skip formatting generated files with Prettier                                        |
| `--output <path>`     | `string`  | Output path for `print-config` command                                               |

**Positional Arguments:**

```bash
npx zod2nx-schema [command] <schema-path> [output-path]
```

- `command` — Command to run: `convert`, `print-config`, `help` (default: `convert`)
- `schema-path` — Path to the TypeScript module exporting the Zod schema
- `output-path` — Output path for the generated JSON schema (auto-derived if not provided)

## Configuration File

Create a `zod2nx-schema.config.ts` (or `.js`, `.mjs`) in your project root for complex setups:

```typescript
import type { GenerateZod2NxSchemaOptions } from '@push-based/zod2nx-schema';

export default [
  {
    schema: './src/executors/build/schema.ts',
    exportName: 'buildOptionsSchema',
    outPath: './src/executors/build/schema.json',
    options: {
      name: 'BuildExecutorOptions',
      title: 'Build Executor Options',
      description: 'Options for the build executor',
      includeCommandDefault: true,
      additionalProperties: false,
    },
  },
  {
    schema: './src/generators/init/schema.ts',
    outPath: './src/generators/init/schema.json',
    options: {
      name: 'InitGeneratorOptions',
      title: 'Init Generator Options',
    },
  },
] satisfies GenerateZod2NxSchemaOptions[];
```

**Configuration Options:**

| Property                        | Type      | Required | Description                                              |
| ------------------------------- | --------- | -------- | -------------------------------------------------------- |
| `schema`                        | `string`  | ✅       | Path to the TypeScript module exporting the Zod schema   |
| `exportName`                    | `string`  | ❌       | Name of the export (default: `'default'`)                |
| `outPath`                       | `string`  | ❌       | Output path (auto-derived from `schema` path if not set) |
| `options.name`                  | `string`  | ❌       | Schema name for `$id` (auto-derived from `exportName`)   |
| `options.title`                 | `string`  | ❌       | Schema title (defaults to `name`)                        |
| `options.description`           | `string`  | ❌       | Schema description                                       |
| `options.includeCommandDefault` | `boolean` | ❌       | Add Nx `$default` for command property (default: `true`) |
| `options.additionalProperties`  | `boolean` | ❌       | Allow additional properties (default: `true`)            |

The CLI will automatically look for configuration files in this order:

1. `zod2nx-schema.config.ts`
2. `zod2nx-schema.config.mjs`
3. `zod2nx-schema.config.js`

## API Reference

### `zod2nxSchema(zodSchema, options)`

Converts a Zod schema to an Nx executor/generator schema object.

**Parameters:**

| Parameter                       | Type           | Required | Description                                              |
| ------------------------------- | -------------- | -------- | -------------------------------------------------------- |
| `zodSchema`                     | `z.ZodTypeAny` | ✅       | The Zod schema to convert                                |
| `options.name`                  | `string`       | ✅       | Schema name (used for `$id`)                             |
| `options.title`                 | `string`       | ❌       | Schema title (defaults to `name`)                        |
| `options.description`           | `string`       | ❌       | Schema description                                       |
| `options.includeCommandDefault` | `boolean`      | ❌       | Add Nx `$default` for command property (default: `true`) |
| `options.additionalProperties`  | `boolean`      | ❌       | Allow additional properties (default: `true`)            |

**Returns:** `NxSchema` object

### `generateSchemaFile(options)`

Generates a single schema JSON file from a Zod schema module.

```typescript
import { generateSchemaFile } from '@push-based/zod2nx-schema';

await generateSchemaFile({
  schema: './src/schema.ts',
  exportName: 'mySchema',
  outPath: './dist/schema.json',
  options: {
    name: 'MySchema',
    title: 'My Schema',
  },
});
```

### `generateManySchemaFiles(options[])`

Generates multiple schema files in parallel.

```typescript
import { generateManySchemaFiles } from '@push-based/zod2nx-schema';

const results = await generateManySchemaFiles([
  {
    schema: './src/executor-schema.ts',
    outPath: './dist/executor-schema.json',
    options: { name: 'ExecutorSchema' },
  },
  {
    schema: './src/generator-schema.ts',
    outPath: './dist/generator-schema.json',
    options: { name: 'GeneratorSchema' },
  },
]);
```

## Supported Zod Validators

The following Zod validators map directly to JSON Schema:

| Zod Method                   | JSON Schema                                    |
| ---------------------------- | ---------------------------------------------- |
| `.string()`                  | `{ "type": "string" }`                         |
| `.number()`                  | `{ "type": "number" }`                         |
| `.int()`                     | `{ "type": "integer" }`                        |
| `.boolean()`                 | `{ "type": "boolean" }`                        |
| `.array()`                   | `{ "type": "array" }`                          |
| `.object()`                  | `{ "type": "object" }`                         |
| `.enum(['a', 'b'])`          | `{ "enum": ["a", "b"] }`                       |
| `.min(n)` / `.max(n)`        | `minLength`/`maxLength` or `minimum`/`maximum` |
| `.regex(/pattern/)`          | `{ "pattern": "..." }`                         |
| `.url()`                     | `{ "format": "uri" }`                          |
| `.email()`                   | `{ "format": "email" }`                        |
| `.uuid()`                    | `{ "format": "uuid" }`                         |
| `.optional()`                | Removes from `required` array                  |
| `.describe('...')`           | `{ "description": "..." }`                     |
| `.meta({ describe: '...' })` | `{ "describe": "..." }`                        |
| `.positive()`                | `{ "exclusiveMinimum": 0 }`                    |
| `.negative()`                | `{ "exclusiveMaximum": 0 }`                    |
| `.gt(n)` / `.lt(n)`          | `exclusiveMinimum`/`exclusiveMaximum`          |
| `.gte(n)` / `.lte(n)`        | `minimum`/`maximum`                            |

## Limitations

JSON Schema cannot express all Zod features. The following are **not supported**:

- ❌ Custom `.refine()` or `.superRefine()` functions
- ❌ Custom `.transform()` functions
- ❌ `.catch()` default handlers
- ❌ `.preprocess()` functions
- ❌ Runtime-only validations

Stick to validators that map directly to JSON Schema for full compatibility.
