# Configuration Generator

#### @push-based/zod2nx-schema-nx-plugin:configuration

## Usage

`nx generate @push-based/zod2nx-schema-nx-plugin:configuration`

By default, the Nx plugin will search for existing configuration files. If they are not present it creates a `zod2nx-schema.config.ts` and adds a target to your `project.json` file.

You can specify the project explicitly as follows:

`nx g @push-based/zod2nx-schema-nx-plugin:configuration <project-name>`

```text
Root/
├── project-name/
│   ├── project.json 👈 updated
│   ├── zod2nx-schema.config.ts 👈 generated
│   └── ...
└── ...
```

Show what will be generated without writing to disk:

`nx g configuration ... --dry-run`

## Options

| Name              | type                               | description                                                |
| ----------------- | ---------------------------------- | ---------------------------------------------------------- |
| **--project**     | `string` (REQUIRED)                | The name of the project.                                   |
| **--targetName**  | `string` (DEFAULT 'zod2nx-schema') | The id used to identify a target in your project.json.     |
| **--bin**         | `string`                           | Path to zod2nx-schema CLI                                  |
| **--skipProject** | `boolean` (DEFAULT false)          | Skip adding the target to `project.json`.                  |
| **--skipConfig**  | `boolean` (DEFAULT false)          | Skip adding the `zod2nx-schema.config.ts` to project root. |
