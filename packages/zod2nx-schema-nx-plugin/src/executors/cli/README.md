# Command Executor

This executor is used to run the zod2nx-schema CLI in an Nx workspace.
For details on the CLI command read the [CLI documentation](https://github.com/push-based/zod2nx-schema#readme).

#### @push-based/zod2nx-schema-nx-plugin:cli

## Usage

Configure a target in your `project.json`.

```jsonc
// {projectRoot}/project.json
{
  "name": "my-project",
  "targets": {
    "zod2nx-schema": {
      "executor": "@push-based/zod2nx-schema-nx-plugin:cli",
    },
  },
}
```

Run
`nx run <project-name>:zod2nx-schema`

```text
Root/
├── project-name/
│   ├── zod2nx-schema.config.ts 👈 executed
│   ├── schema.json 👈 generated
│   └── ...
└── ...
```

By default, the Nx plugin will derive the options from the executor config.

The following things happen:

- the output directory defaults to `${projectRoot}`
- the config file defaults to `${projectRoot}/zod2nx-schema.config.ts`
- parses terminal arguments and forwards them to the CLI command (they override the executor config)
- the CLI command is executed

```jsonc
{
  "name": "my-project",
  "targets": {
    "zod2nx-schema": {
      "executor": "@push-based/zod2nx-schema-nx-plugin:cli",
      "options": {
        "verbose": true,
      },
    },
  },
}
```

Show what will be executed without actually executing it:

`nx run my-project:zod2nx-schema --dryRun`

## Options

| Name           | type      | description                                                                  |
| :------------- | :-------- | :--------------------------------------------------------------------------- |
| **verbose**    | `boolean` | Print additional logs                                                        |
| **dryRun**     | `boolean` | Print the commands that would be run, but don't actually run them            |
| **bin**        | `string`  | Path to CLI binary                                                           |
| **command**    | `string`  | The command to run (e.g., 'convert')                                         |
| **fromPkg**    | `string`  | Path to package.json of the Nx plugin for auto deriving schemas              |
| **config**     | `string`  | Path to a configuration file (if not provided, e.g. zod2nx-schema.config.ts) |
| **tsconfig**   | `string`  | Path to a TypaScript configuration file used to resolve config files         |
| **skipFormat** | `boolean` | Skip formatting generated files with Prettier                                |
| **output**     | `string`  | Output path for print-config command (if not provided, prints to stdout)     |
| **schema**     | `string`  | Path to the module exporting the Zod schema                                  |
| **outPath**    | `string`  | Path to output the generated JSON schema file                                |
| **exportName** | `string`  | Name of the export in the module (default: "default")                        |

For all other options, see the [CLI documentation](https://github.com/push-based/zod2nx-schema#readme).
