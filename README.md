<h1 align="center">Zod to Nx Schema</h1>
<h2 align="center">Convert Zod schemas to Nx executor/generator schema.json files</h2>

---

[![license](https://img.shields.io/github/license/push-based/zod2nx-schema)](https://opensource.org/licenses/MIT)

---

## Overview

`zod2nx-schema` is a tool that converts Zod schemas into Nx executor/generator schema.json files. This makes it easy to define executor options using Zod's type-safe schema validation and automatically generate the JSON schema files that Nx requires.

## Packages

- **[`@push-based/zod2nx-schema`](./packages/zod2nx-schema)** - Core CLI tool for converting Zod schemas to Nx schemas
- **[`@push-based/zod2nx-schema-nx-plugin`](./packages/zod2nx-schema-nx-plugin)** - Nx plugin that integrates the schema generation into your build process

## Quick Start

### Installation

```bash
npm install @push-based/zod2nx-schema
```

### Usage

```bash
zod2nx-schema --schemaModulePath ./src/schema.ts --exportName MySchema
```

This will generate a `schema.json` file based on your Zod schema export.

## Features

- 🔒 **Type-safe** - Define schemas using Zod's powerful type system
- 📦 **Zero config** - Works out of the box with sensible defaults
- 🎯 **Nx integration** - Seamlessly integrates with Nx executors
- 📝 **Metadata support** - Add titles, descriptions, and other metadata to your schemas

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.
