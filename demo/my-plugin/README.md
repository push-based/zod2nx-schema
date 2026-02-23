# Demo Plugin

After the plugin and generators/executors are present, follow the below steps:

1. Setup the plugin in the workspace

```bash
nx g @push-based/zod2nx-schema-nx-plugin:init --registerSyncGenerator --registerPlugin
```

2. Add configuration to your project `zod2nx-schema.config.ts`

```bash
# manual generator usage
nx g @push-based/zod2nx-schema-nx-plugin:configuration --project=my-plugin
# or via registered plugin (when init used with --registerPlugin)
nx run my-plugin:zod2nx-schema--configuration
```

3. Generate the JSON schema

```bash
nx run my-plugin:zod2nx-schema
# over global sync generator (when init used with --registerSyncGenerator)
nx run my-plugin:build
```
