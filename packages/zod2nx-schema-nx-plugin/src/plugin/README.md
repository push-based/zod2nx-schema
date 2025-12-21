# @push-based/zod2nx-schema-nx-plugin

The Nx Plugin for [zod2nx-schema](https://github.com/push-based/zod2nx-schema#readme), a tool to convert Zod schemas to Nx executor schema.json files.

Why should you use this plugin?

- Zero setup cost. Just run the `init` generator and you're good to go.
- Smoother CI integration
- Minimal configuration
- Automated setup, migration and maintenance

## Usage

```jsonc
// nx.json
{
  //...
  "plugins": ["@push-based/zod2nx-schema-nx-plugin"],
}
```

or with options:

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "@push-based/zod2nx-schema-nx-plugin",
      "options": {
        "projectPrefix": "cli",
      },
    },
  ],
}
```

Now every project will have `zod2nx-schema--configuration` target if no `zod2nx-schema.{ts,mjs,js}` is present.

- `nx run <project-name>:zod2nx-schema--configuration`
- `nx run <project-name>:zod2nx-schema--configuration  --skipFormat`

Run it and the project will get automatically configured.

```text
Root/
├── project-name/
│   ├── zod2nx-schema.config.ts 👈 generated
│   └── ...
└── ...
```

For details visit the [configuration generator docs](../generators/configuration/README.md).

With the configuration from above a `zod2nx-schema` target is now present.

- `nx run <project-name>:zod2nx-schema`

Run it and the project will get automatically collect the report.

```text
Root/
├── .zod2nx-schema/
│   └── project-name
│       ├── report.md 👈 generated
│       └── report.json 👈 generated
├── project-name/
│   ├── zod2nx-schema.config.ts
│   └── ...
└── ...
```

Pass positional arguments to execute a specific command, use named arguments to overwrite defaults.

- `nx run <project-name>:zod2nx-schema --onlyPlugins=eslint`
- `nx run <project-name>:zod2nx-schema collect`
- `nx run <project-name>:zod2nx-schema upload --upload.server=https://staging.zod2nx-schema.dev`

For a full list of commands visit the [zod2nx-schema CLI documentation](https://github.com/push-based/zod2nx-schema#readme).

## Options

| Name              | type                               | description                                            |
| ----------------- | ---------------------------------- | ------------------------------------------------------ |
| **projectPrefix** | `string`                           | prefix for upload.project on non root projects         |
| **targetName**    | `string` (DEFAULT 'zod2nx-schema') | The id used to identify a target in your project.json. |
| **bin**           | `string`                           | Path to zod2nx-schema CLI                              |

All options are optional and provided in the `nx.json` file.

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "@push-based/zod2nx-schema-nx-plugin",
      "options": {
        "projectPrefix": "cli",
        "targetName": "zod2nx",
        "bin": "dist/package/zod2nx-schema-custom-build",
      },
    },
  ],
}
```
