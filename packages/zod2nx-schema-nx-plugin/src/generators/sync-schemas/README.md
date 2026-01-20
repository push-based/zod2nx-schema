# Sync Schemas Generator

This generator automatically detects when schema.json files are out of sync with their Zod definitions and reports the issues.

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
3. **Reporting**: Returns detailed information about out-of-sync files

## Integration

This generator is automatically configured as a global sync generator in `nx.json`:

```jsonc
{
  "sync": {
    "globalGenerators": ["@push-based/zod2nx-schema-nx-plugin:sync-schemas"]
  }
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

### Issues Found
```
 NX   The workspace is out of sync

Schema files are out of sync:
  - 2 missing schema.json file(s) (schema.ts exists but schema.json doesn't)
  - 1 stale schema.json file(s) (content doesn't match schema.ts)

Run "nx sync" to fix these issues.
```

## Technical Details

- Uses dynamic imports to avoid circular dependencies during sync operations
- Compares JSON content deterministically by generating expected schema output
- Handles errors gracefully and continues checking other projects
- Integrates with Nx's sync infrastructure for automatic execution