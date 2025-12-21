# Zod to NxSchema

A TypeScript library and CLI tool that converts Zod schemas to Nx executor schema.json files. This tool uses `zod-to-json-schema` under the hood and adds Nx-specific features like `$default` for argv parameters.

## Features

- ✅ Converts Zod schemas to JSON Schema (draft-07) compatible with Nx executors
- ✅ Automatically handles complex types like arrays of enums
- ✅ Adds Nx-specific `$default` for command parameters from argv
- ✅ Supports regex patterns, min/max constraints, URL validation, etc.
- ✅ CLI tool for build-time schema generation
- ✅ TypeScript API for programmatic usage
- ✅ Automatic schema name generation from export names in PascalCase

## Installation

```bash
npm install @push-based/zod2nx-schema
```

## Quick Usage

Install the CLI:
`npm install -g @push-based/zod2nx-schema`

```bash
# Auto-derive output filename (./src/schema.ts → ./src/schema.json)
npx zod2nx-schema ./src/schema.ts

# Explicit output path
npx zod2nx-schema ./src/schema.ts ./schema-transformed.json

# Custom filename in same directory (./src/schema.ts → ./src/executor.json)
npx zod2nx-schema ./src/schema.ts --filename executor.json

# With named export (schema name is automatically derived)
npx zod2nx-schema ./src/schema.ts --export autorunOptions

# With additional options
npx zod2nx-schema ./src/schema.ts \
  --export-name autorunOptions \
  --title "Zod2NxSchema CLI executor" \
  --description "Executes the @push-based/zod2nx-schema CLI"

# Autoderives from Nx plugin package.json
npx zod2nx-schema --fromPkg ./plugin/package.json
```

## Config file

You can also provide a config file `zod2nx-schema.config.json` in the current working directory:

```json
[
  {
    "schema": "./src/schema.ts",
    "outPath": "./dist/executor-schema.json",
    "name": "myExecutorSchema",
    "options": {
      "title": "My Executor Schema",
      "description": "This schema is generated from Zod",
      "includeCommandDefault": true,
      "additionalProperties": false
    }
  }
]
```

Then run:

````bash

## Options

| Name                          | Type      | Description                                                             |
|-------------------------------|-----------|-------------------------------------------------------------------------|
| **schema**                    | `string`  | Path to the TypeScript module that exports the Zod schema to convert    |
| **outPath**                   | `string`  | Optional output path for the generated JSON schema file                 |
| **--export-name**                    | `string`  | Name of the export from the schema module (defaults to 'default')       |
| **--title**                   | `string`  | Title to include in the generated JSON schema                           |
| **--description**             | `string`  | Description to include in the generated JSON schema                     |
| **--include-command-default** | `boolean` | Whether to include Nx $default for command parameter (defaults to true) |
| **--additional-properties**   | `boolean` | Whether to allow additional properties in the schema (defaults to true) |

### Programmatic API

```typescript
import {z} from 'zod';
import {zod2NxSchema} from '@push-based/zod2nx-schema';

// 1) Define your options with Zod
export const myExecutorSchema = z.object({
  name: z.string().min(1, 'name cant be empty').meta({
    describe: 'Name of a thing',
  })
});

// 2) Convert to Nx schema
const nxSchemaJson = zod2NxSchema(myExecutorSchema, {
  name: 'MyExecutorSchema',
  title: 'My helpful Executor Schema',
  description: 'This executor is Nx-specific',
  includeCommandDefault: true,
  additionalProperties: true,
});

console.log(nxSchemaJson);
````

## API Reference

### `zodToNxSchema(zodSchema, options)`

Converts a Zod schema to an Nx executor schema object.

**Parameters:**

- `zodSchema`: The Zod schema to convert
- `options`: Configuration options
  - `name`: Schema name (used for `$id`)
  - `title?`: Schema title (defaults to `name`)
  - `description?`: Schema description
  - `includeCommandDefault?`: Add Nx `$default` for command parameter (default: `true`)
  - `additionalProperties?`: Allow additional properties (default: `true`)

**Returns:** `NxExecutorSchema` object

### `zodToNxSchemaString(zodSchema, options, indent?)`

Same as `zodToNxSchema` but returns a JSON string.

**Parameters:**

- Same as `zodToNxSchema`
- `indent?`: JSON indentation (default: `2`)

**Returns:** JSON string

### Nx Integration

- Automatically adds `$default: { $source: 'argv', index: 0 }` for command parameters (only when command exists)
- Follows Nx executor schema conventions
- Compatible with `nx.json` and executor registration
- Preserves all JSON Schema fields from Zod (required, definitions, etc.)
- Nx fields always take precedence over Zod-generated fields

## Limitations

JSON Schema cannot express Zod transforms/refinements with custom logic. Stick to validators that map directly:

- ✅ `regex()`, `min()`, `max()`, `url()`, `int()`, `gt()`, `lt()`
- ❌ Custom `.catch()`, `.refine()` or `.transform()` functions
