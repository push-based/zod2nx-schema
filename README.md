<h1 align="center">Zod to NX Schema</h1>
<h2 align="center">Convert Zod schemas to Nx executor schema.json files</h2>

---

[![license](https://img.shields.io/github/license/code-pushup/cli)](https://opensource.org/licenses/MIT)

---

## Overview

`zod2nx-schema` is a tool that converts Zod schemas into Nx executor schema.json files. This makes it easy to define executor options using Zod's type-safe schema validation and automatically generate the JSON schema files that Nx requires.

## Packages

- **[`@code-pushup/zod2nx-schema`](./packages/zod2nx-schema)** - Core CLI tool for converting Zod schemas to Nx schemas
- **[`@code-pushup/nx-plugin`](./packages/nx-plugin)** - Nx plugin that integrates the schema generation into your build process

## Quick Start

### Installation

```bash
npm install @code-pushup/zod2nx-schema
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
