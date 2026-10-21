# dsh-agent-manager

[![CI](https://github.com/WatchDG/dsh-agent-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/WatchDG/dsh-agent-manager/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**English** | [Русский](README.ru.md)

An Agent Manager plugin for [DeepSeek Harness](https://www.deepseek.com/en/harness/):
create, list, message, and interrupt the sub-agents of your sessions — from a
live Web panel in the conversation header, from `/agent-manager` in chat, or
from model-facing tools (`agent_manager_*`). When the Host's Agent Teams
runtime is mounted, the same surfaces also report the team roster and shared
task board.

The plugin adds no framework of its own: it manages the same continuable
sub-agents the Harness already owns (spawn/fork providers), so created agents
get the full session machinery — persistence, cold resume, follow-up turns —
for free.

## Features

- **Persistent defined agents** — Settings → Agents keeps a durable registry
  (profile-global, `<workspace>/.agent-manager/state.json`) of agent
  definitions: name, description, base prompt, backend, and model policy.
  Create, edit, and delete them there; they survive restarts and are
  available to every session.
- **Per-agent model selection** — a definition either inherits the spawning
  session’s model, lets the coordinator choose an exact route from the
  distribution list, or pins its own provider/model. Pinned agents always keep
  their route; auto agents fall back to the session model when the coordinator
  makes no choice.
- **Spawn by task** — a defined agent is spawned into any session with a
  concrete task (`agent_manager_spawn`, `/agent-manager run`, or the spawn
  block in Settings). The child runs the base prompt plus the task in a new
  continuable session.
- **Web panel** — an “Agents” action in the conversation header lists the
  session's spawned children with live status, lets you message and interrupt
  them, and copy session ids.
- **Model-facing tools** — `agent_manager_list`, `agent_manager_spawn`,
  `agent_manager_list_models`, `agent_manager_message`,
  `agent_manager_interrupt`, plus the `agent_manager_task_create/list/update`
  shared-board tools when the Agent Teams runtime is present. One operation,
  same behavior as the UI.
- **Command** — `/agent-manager` for status and `/agent-manager run [--model <provider>/<model>] <agent> | <task>`
  to spawn a defined agent.
- **Settings page** — Settings → Agents: backend default, distribution models,
  list limit, header action visibility, auto-refresh interval, tool
  registration toggle — plus the persistent definition registry and spawn
  block above.
- **Optional Agent Teams integration** — when `ctx.agentTeams` is mounted, the
  overview includes roster members (lead/teammate, status, model) and shared
  tasks; teammate names become valid message/interrupt targets from the Lead.

## Requirements

| Requirement | Details |
|---|---|
| [DeepSeek Harness](https://www.deepseek.com/en/harness/) | 0.2.x (tested with 0.2.1-rc.2). The plugin uses the Host `subagents`, `agents`, `tools`, `commands`, `systemPrompt`, and `webServer` services. |
| Sub-agent providers | The `subagent-spawn-in-process` / `subagent-fork-in-process` rows of the base profile (enabled by default in web/desktop profiles). |
| Model catalog (optional) | The Host `llm` service for the provider/model lists; without it, saved routes stay visible, but new provider/model choices require an advertised catalog. |
| Host model policy (optional) | The Host `subagent-model-selection` service; when enabled, its allowed routes become the coordinator’s list if the plugin list is empty. |
| Agent Teams (optional) | The Host Agent Teams runtime (`agent-team` row) for roster/task surfaces. Without it, direct child-agent management still works. |

## Installation

The plugin is a bundle for the current DSH profile, so it applies to every
session of that profile.

1. Open the **Plugins** page in the DSH sidebar (the Plugin Manager).
2. Choose **Add plugin** / **Install bundle**, select this directory (the one
   containing `package.json`), and confirm.
3. Make sure **Agent Manager** is enabled in the plugin list.

The same step is available to an agent through the `plugin_manager` tool with
`action: install_bundle` and the absolute path to this directory. DSH records
a `link:` dependency on the directory in the profile's `package.json`; because
the directory is linked, restart DSH after updating the plugin's files so Host
JavaScript is loaded again.

To uninstall, remove the bundle from the Plugin Manager (or
`plugin_manager` `action: remove_bundle`).

## Using it

### Web panel

Open any conversation and click the **Agents** action in the header. The panel
lists the child agents spawned under that session. Type into an agent's row to
message it, copy its session id, or press **Interrupt** to stop a running turn.
The panel refreshes automatically while open.

Persistent definitions and spawning live in **Settings → Agents**; the header
panel manages the resulting children.

### Command

```
/agent-manager
/agent-manager run reviewer | Review the latest commit.
/agent-manager run --session session-42 writer | Draft the release notes.
/agent-manager run --model openai/gpt-5 reviewer | Review the latest commit.
```

The `run` form is `<agent> | <task>`; `--session` targets another live session
and `--model provider/model` supplies the coordinator’s choice for an auto-mode
definition. The route must be one of the configured distribution models. Fixed
agents keep their own route and inherit agents keep the session model, so
`--model` is ignored for them.

### Tools

| Tool | Purpose |
|---|---|
| `agent_manager_list` | List direct child agents (live status), definitions, and team roster/tasks when available. |
| `agent_manager_spawn` | Spawn a defined agent with a task; supports the coordinator’s model route for auto-mode definitions. |
| `agent_manager_list_models` | List the exact LLM routes the coordinator may assign to auto-mode agents. |
| `agent_manager_message` | Send a follow-up message to a child agent (or teammate). |
| `agent_manager_interrupt` | Stop a running child agent (or teammate). |
| `agent_manager_task_create` / `agent_manager_task_list` / `agent_manager_task_update` | Shared team task board (only with the Agent Teams runtime). |

## Configuration

Every field is optional. Override the `agent-manager` row in the profile's
patch layer, or edit it live on **Settings → Agents** (volatile fields apply
immediately).

| Field | Type | Default | Meaning |
|---|---|---|
| `memberProvider` | `'spawn' \| 'fork'` | `'spawn'` | Default backend for new agents. |
| `allowedModels` | `Array<{ provider, model }>` | `[]` | Exact routes the coordinator may assign to auto-mode agents. Empty falls back to the Host `subagent-model-selection` policy, then to the session model. |
| `maxList` | number | `50` | Maximum child rows in tool/HTTP listings (1–200). |
| `headerAction` | boolean | `true` | Show the conversation-header “Agents” action. |
| `autoRefreshMs` | number | `5000` | Panel auto-refresh interval (1000–60000). |
| `toolsEnabled` | boolean | `true` | Register the `agent_manager_*` tools and protocol section. |

```yaml
- id: agent-manager
  config:
    memberProvider: fork
    allowedModels:
      - provider: openai
        model: gpt-5
      - provider: deepseek
        model: deepseek-flash
    maxList: 100
    headerAction: true
    autoRefreshMs: 3000
    toolsEnabled: true
```

## Boundaries

- **Create/message/interrupt require the session to be live** — its agent
  must be resident in this Host. Listing works from the durable child catalog
  even for sessions that are currently closed.
- The plugin manages **direct children** of the session (continuable, one-shot,
  external). Deeper descendants are not surfaced.
- Messages are delivered to the target's inbox; a successful send does not
  mean the recipient has processed the message. Interrupt is fire-and-return:
  the target may keep running until it observes the cancellation signal.
- **Agent Teams is optional.** Without the Host team runtime, `team` is `null`
  in overviews and the task tools are not registered.
- **Model selection requires an `agentOptions`-capable provider.** The bundled
  spawn/fork in-process providers qualify. The distribution list comes from
  `allowedModels`, then the Host `subagent-model-selection` policy, then the
  session route. A fixed definition is authoritative even when the coordinator
  passes a different route. Fork children can run a different route, but that
  may prevent provider-side reuse of the inherited conversation prefix.
- State is owned by the Harness session/subagent services; the plugin keeps no
  separate persistence and performs no network access.

## Verification

1. The **Plugins** page shows **Agent Manager** / **Менеджер агентов** and it
   is enabled.
2. Open any conversation: the header shows the **Agents** action with the
   plugin's icon. Opening it lists an empty state or existing child agents.
3. Create an agent from **Settings → Agents** (or via `/agent-manager run …`,
   or `agent_manager_spawn`). It appears in the list with status `running`
   while its first turn executes.
4. Edit an agent and set its model mode to `fixed`, then spawn it: the child
   reports the pinned route in the Settings list and `agent_manager_spawn`
   result. With an `auto` agent, pick a distribution model in the spawn block
   or pass `model_provider`/`model` to the tool; omitting it uses the session
   model.
5. Send a message to an agent; it wakes (or continues) and reports back. Use
   **Interrupt** on a running agent and confirm the turn stops.
6. `agent_manager_list` returns the same rows as the panel, and
   `agent_manager_list_models` reports the effective distribution routes.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| The header action is missing | `headerAction: false`, or the panel is opened on the workspace start page without a conversation. |
| “The subagents service is unavailable” | The profile lacks the base subagent rows; reinstall/enable the base profile bundle. |
| “session ... is not live” | The session is closed; open it and retry. |
| Create succeeds but the agent never appears | The child failed provisioning; check the Host log for the subagent provider error. |
| An auto agent ignores the chosen model | The definition is fixed or inherit, so its own policy wins; switch it to auto. The route must also be in the effective distribution list. |
| “no distribution models are configured” | Add routes under **Settings → Agents → Distribution models**, enable the Host Subagent model-selection policy, or omit `model_provider`/`model` to use the session model. |
| A fixed agent fails to spawn | Edit the definition and set both the model provider and model id. |
| No team roster/tasks | The Agent Teams runtime is not mounted; direct child management still works. |

## Development

One dependency (`@deepseek-ai/schemastery` for the settings schema) and no
build step.

```bash
npm ci
npm test                 # unit + manifest tests
npm run test:unit        # same, explicit
npm run pack:check       # verify the npm package contents
```

Layout:

```
index.js              Host entry point: exports apply / name / inject / Config
client.js             Web client: Settings → Agents page + conversation-header panel
lib/config.js         Config schema, defaults, normalization, volatile snapshot
lib/agents.js         pure catalog mapping and request validation
lib/api.js            manager facade over Host subagents/agents/agentTeams services
lib/tools.js          model-facing tool definitions (agent_manager_*)
lib/command.js        /agent-manager parser and handler
lib/plugin.js         context wiring (section + tools + command + /agents/* routes + settings)
test/                 node:test suites (unit, manifest, integration gate)
```

When adding a runtime module, add it to `files` in `package.json`; the manifest
test fails otherwise. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security and privacy

- The plugin performs no network access and sends no telemetry. The Web panel
  talks only to the Host's own authenticated `/agents/*` routes.
- All operations run through the Host's in-process subagent service with the
  calling session's agent as the authority; there is no shell execution or
  OS-level sandbox change.
- The plugin keeps no persistent state of its own; agent data lives in the
  Harness session logs and subagent catalogs.

## Links

- **DeepSeek Harness** — https://www.deepseek.com/en/harness/
- **Plugin repository** — https://github.com/WatchDG/dsh-agent-manager
- **Related: Agent Teams reference** — https://github.com/NanmiCoder/dsh-agent-teams

## License

[Apache-2.0](LICENSE), © 2026 Baranov Grigoriy Vladimirovich.
