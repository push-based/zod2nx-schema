# Configuration Generator

#### @push-based/zod2nx-schema-nx-plugin:configuration

## Usage

`nx generate @push-based/zod2nx-schema-nx-plugin:configuration`

By default, the Nx plugin will search for existing configuration files. If they are not present it creates a `zod2nx-schema.config.ts`.

You can specify the project explicitly as follows:

`nx g @push-based/zod2nx-schema-nx-plugin:configuration <project-name>`

```text
Root/
├── project-name/
│   ├── zod2nx-schema.config.ts 👈 generated
│   └── ...
└── ...
```

Show what will be generated without writing to disk:

`nx g configuration ... --dry-run`

## Options

| Name                               | type                      | description                                                          |
| ---------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| **--project**                      | `string` (REQUIRED)       | The name of the project.                                             |
| **--bin**                          | `string`                  | Path to zod2nx-schema CLI                                            |
| **--skipConfig**                   | `boolean` (DEFAULT false) | Skip adding the `zod2nx-schema.config.ts` to project root.           |
| **--skipFormat**                   | `boolean` (DEFAULT false) | Skip formatting of changed files                                     |
| **--registerSyncGeneratorLocally** | `boolean` (DEFAULT false) | Register the sync generator locally for a specific task              |
| **--taskName**                     | `string`                  | The task name to register the sync generator for (e.g., build, lint) |
