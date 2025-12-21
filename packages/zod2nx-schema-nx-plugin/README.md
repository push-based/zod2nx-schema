# @push-based/zod2nx-schema-nx-plugin

### Plugin

Register this plugin in your `nx.json` to leverage a set of generators and executors to integrate zod2nx-schema into a Nx workspace.

#### Registration

```jsonc
// nx.json
{
  //...
  "plugins": ["@push-based/zod2nx-schema-nx-plugin"],
}
```

Resulting targets:

- `nx run <project-name>:zod2nx-schema--configuration` (no config file present)
- `nx run <project-name>:zod2nx-schema` (`zod2nx-schema.config.{ts,mjs,js}` is present)

### Generators

#### Init

Install JS packages and register plugin.
See [init generator docs](./src/generators/init/README.md) for details

Examples:

- `nx g @push-based/zod2nx-schema-nx-plugin:init` - setup push-based in the workspace
- `nx g @push-based/zod2nx-schema-nx-plugin:init  --skipPackageJson` - skip `package.json` update

#### Configuration

Adds a `zod2nx-schema.config.ts` to your project root.
See [configuration generator docs](./src/generators/configuration/README.md) for details

Examples:

- `nx g @push-based/zod2nx-schema-nx-plugin:configuration --project=<project-name>`

### Executor

#### CLI

Install JS packages configure a target in your project json.
See [CLI executor docs](./src/executors/cli/README.md) for details

Examples:

```json
{
  "name": "my-project",
  "targets": {
    "push-based": {
      "executor": "@push-based/zod2nx-schema-nx-plugin:cli",
      "options": {
        "config": "zod2nx-schema.config.ts"
      }
    }
  }
}
```

- `nx run <project-name>:push-based`
- `nx run <project-name>:push-based --help`
