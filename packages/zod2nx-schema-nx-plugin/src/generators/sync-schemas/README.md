# Sync Schemas Generator

This generator automatically keeps schema.json files in sync with their Zod definitions.

## Overview

The sync schemas generator follows the same mental model as Nx's TypeScript sync generator:

- **Single Source of Truth**: `schema.ts` (Zod AST + config) is the definitive source
- **Deterministic**: No timestamps or heuristics - generates expected content and compares
- **Three Sync Conditions**:
  - **Missing**: `schema.ts` exists but `schema.json` doesn't
  - **Stale**: `schema.json` content doesn't match what would be generated from `schema.ts`
  - **Extra**: `schema.json` exists but `schema.ts` no longer exists

## How It Works

1. **Discovery**: Scans all Nx projects for `zod2nx-schema.config.*` files
2. **Validation**: For each schema configuration entry, checks if files are in sync
3. **Sync**: Automatically fixes any out-of-sync files

## Integration

This generator can be configured both globally and on a per-task basis in `nx.json`:

### Global Configuration

Configure it as a global sync generator to run with all sync operations:

```jsonc
{
  "sync": {
    "globalGenerators": ["@push-based/zod2nx-schema-nx-plugin:sync-schemas"],
  },
}
```

### Task-Based Configuration

Configure it to run before specific tasks (e.g., build):

```jsonc
{
  "targetDefaults": {
    "build": {
      "syncGenerators": ["@push-based/zod2nx-schema-nx-plugin:sync-schemas"],
    },
  },
}
```

## Usage

### Check for Sync Issues

```bash
nx sync --check
```

### Fix Sync Issues

```bash
nx sync
```

### Manual Execution

```bash
nx g @push-based/zod2nx-schema-nx-plugin:sync-schemas
```

## Output Examples

### No Issues

```
 NX   The workspace is already up to date

[@push-based/zod2nx-schema-nx-plugin:sync-schemas]: All files are up to date.
```

## Technical Details

- Uses dynamic imports to avoid circular dependencies during sync operations
- Compares JSON content deterministically by generating expected schema output
- Handles errors gracefully and continues checking other projects
- Integrates with Nx's sync infrastructure for automatic execution
