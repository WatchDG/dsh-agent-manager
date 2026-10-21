# Contributing

Thanks for considering a contribution to `dsh-agent-manager`.

## Before you start

- Read the [README](README.md) to understand the bundle and its requirements.
- The plugin targets [DeepSeek Harness](https://www.deepseek.com/en/harness/)
  0.2.x and relies on the Host `subagents`, `agents`, `tools`, `commands`,
  `systemPrompt`, and `webServer` services. The `llm` and
  `subagentModelSelection` services are optional: model discovery and the
  distribution-model fallback degrade gracefully when they are absent.

## Development

The package has one runtime dependency (`@deepseek-ai/schemastery`) and no
build step.

```bash
npm test                 # unit + manifest tests
npm run test:unit        # explicit unit suite
npm run test:integration # skipped unless DSH_AGENT_MANAGER_INTEGRATION is set
npm run pack:check       # inspect the files npm would publish
```

Requirements: Node.js 20 or newer. Run the tests before opening a pull request.
CI runs them on Linux and Windows with Node.js 20, 22, and 24.

## Bundle checklist

This repository is a DSH plugin bundle, so keep these invariants:

- `package.json` declares `dsh.bundle.patch` and the patch inserts exactly one
  `agent-manager` row pointing at the package name.
- Runtime modules live in `lib/` and are covered by the `files` array
  (`lib/*.js`). The manifest test fails when a module is missing from it.
- `locale/en.json` and `locale/ru.json` keep meaningful `meta.title` and
  `meta.description`; the icon stays a valid SVG below 256 KiB.
- All operations run through `lib/api.js`; the tools, routes, and command share
  one facade so behavior stays identical across surfaces.
- Configuration stays backward compatible: unknown fields are ignored and all
  fields remain optional.
- Documentation links to https://www.deepseek.com/en/harness/.

## Code style

- ES modules, 2-space indentation, no semicolons, single quotes.
- Pure logic goes in `lib/agents.js` and `lib/command.js` so it can be tested
  without a process or a Harness.
- Service boundaries stay in `lib/api.js`; context wiring stays in
  `lib/plugin.js`; model-facing definitions stay in `lib/tools.js`.
- The Web client (`client.js`) uses only theme tokens and imports no Harness
  Client packages; add or update tests with every behavior change.

## Reporting issues

Open an issue at https://github.com/WatchDG/dsh-agent-manager/issues with the
DSH version, the operating system, the affected surface (panel/tool/command),
and the relevant log or error text.

## License

By contributing, you agree that your contributions are licensed under the
Apache License 2.0, as described in [LICENSE](LICENSE).
