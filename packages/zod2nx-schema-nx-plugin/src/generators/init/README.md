# Init Generator

#### @push-based/zod2nx-schema-nx-plugin:init

## Usage

`nx generate @push-based/zod2nx-schema-nx-plugin:init`

By default, the Nx plugin will update your `package.json` with needed dependencies and register the plugin in your `nx.json` configuration.

You can specify the collection explicitly as follows:

`nx g @push-based/zod2nx-schema-nx-plugin:init`

```text
Root/
├── ...
├── nx.json 👈 updated
├── package.json 👈 updated
└── ...
```

Show what will be generated without writing to disk:

`nx g @push-based/zod2nx-schema-nx-plugin:init --dry-run`

## Options

| Name                                | type                        | description                                                            |
| ----------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| **--skipPackageJson**               | `boolean` (DEFAULT `false`) | Skip adding `package.json` dependencies.                               |
| **--skipNxJson**                    | `boolean` (DEFAULT `false`) | Skip updating `nx.json` with configuration.                            |
| **--skipInstall**                   | `boolean` (DEFAULT `false`) | Skip installing dependencies.                                          |
| **--registerSyncGeneratorGlobally** | `boolean` (DEFAULT `false`) | Register the sync generator globally in nx.json sync.globalGenerators. |
| **--registerPlugin**                | `boolean` (DEFAULT `false`) | Register the plugin in nx.json plugins array.                          |
