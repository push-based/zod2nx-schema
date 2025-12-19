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
├── .zod2nx-schema/
│   ├── report.json 👈 generated
│   └── report.md 👈 generated
├── project-name/
│   ├── project.json
│   ├── zod2nx-schema.config.ts 👈 executed
│   └── ...
└── ...
```

By default, the Nx plugin will derive the options from the executor config.

The following things happen:

- the output directory defaults to `${workspaceRoot}/.zod2nx-schema/${projectName}`
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
        "projectPrefix": "cli",
        "verbose": true,
      },
    },
  },
}
```

Show what will be executed without actually executing it:

`nx run my-project:zod2nx-schema --dryRun`

## Options

| Name              | type      | description                                                        |
| ----------------- | --------- | ------------------------------------------------------------------ |
| **projectPrefix** | `string`  | prefix for upload.project on non root projects                     |
| **dryRun**        | `boolean` | To debug the executor, dry run the command without real execution. |
| **bin**           | `string`  | Path to zod2nx-schema CLI                                          |

For all other options, see the [CLI documentation](https://github.com/push-based/zod2nx-schema#readme).
