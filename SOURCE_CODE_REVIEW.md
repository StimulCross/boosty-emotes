# Source Code Review

This extension is built using the [WXT](https://wxt.dev) framework and managed via **pnpm**.

## Environment & Requirements

- **Node.js:** 26.2.0
- **pnpm:** 11.4.0
- **OS:** Cross-platform (developed on Linux Fedora)

## Environment Variables

The source archive includes a `.env` file alongside the source code. This file is required to produce a reproducible build — without it, WXT generates different chunk hashes, making it impossible to verify that the submitted build matches the provided sources.

## Build Instructions

Extract the source archive and navigate to the project root directory.

Install all dependencies using the lockfile to guarantee a reproducible environment:

```bash
pnpm install --frozen-lockfile
```

Then run the Firefox build and packaging script:

```bash
pnpm run zip:firefox
```

## Output

The resulting archive will be located at:

```
./dist/boosty-emotes-<VERSION>-firefox.zip
```

Its contents match exactly the submitted extension package.
