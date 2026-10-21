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

- **Web panel** — an “Agents” action in the conversation header lists the
  session's managed agents with live status (running/inactive), lets you
  create a new agent (name, description, initial prompt, spawn/fork), send a
  follow-up message to any agent, interrupt a running one, and copy session
  ids. The panel auto-refreshes while open and uses the host theme.
- **Model-facing tools** — `agent_manager_list`, `agent_manager_create`,
  `agent_manager_message`, `agent_manager_interrupt`, plus the
  `agent_manager_task_create/list/update` shared-board tools when the Agent
  Teams runtime is present. One operation, same behavior as the UI.
- **Command** — `/agent-manager` for a text overview and quick creation.
- **Settings page** — Settings → Agents: backend default, list limit, header
  action visibility, auto-refresh interval, tool registration toggle.
- **Optional Agent Teams integration** — when `ctx.agentTeams` is mounted, the
  overview includes roster members (lead/teammate, status, model) and shared
  tasks; teammate names become valid message/interrupt targets from the Lead.

## Requirements

| Requirement | Details |
|---|---|
| [DeepSeek Harness](https://www.deepseek.com/en/harness/) | 0.2.x (tested with 0.2.1-rc.2). The plugin uses the Host `subagents`, `agents`, `tools`, `commands`, `systemPrompt`, and `webServer` services. |
| Sub-agent providers | The `subagent-spawn-in-process` / `subagent-fork-in-process` rows of the base profile (enabled by default in web/desktop profiles). |
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
shows the agents created under that session. Use the form to create one, type
into an agent's row to message it, and press **Interrupt** to stop a running
turn. The panel refreshes automatically while open.

**Creating an agent from the panel starts its first turn immediately.** The
new agent begins with the prompt you enter.

### Command

```
/agent-manager
/agent-manager create Review the PR | Read the diff and summarize risks.
/agent-manager create --provider=fork Continue the refactor | Finish task 4.
```

The `create` form is `<description> | <prompt>`: the description is the
one-line label, and the prompt is the complete initial task. `--provider=fork`
inherits the current conversation's completed turns instead of starting fresh.

### Tools

| Tool | Purpose |
|---|---|
| `agent_manager_list` | List direct child agents (live status) plus team roster/tasks when available. |
| `agent_manager_create` | Create one continuable sub-agent (spawn/fork). |
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
| `maxList` | number | `50` | Maximum child rows in tool/HTTP listings (1–200). |
| `headerAction` | boolean | `true` | Show the conversation-header “Agents” action. |
| `autoRefreshMs` | number | `5000` | Panel auto-refresh interval (1000–60000). |
| `toolsEnabled` | boolean | `true` | Register the `agent_manager_*` tools and protocol section. |

```yaml
- id: agent-manager
  config:
    memberProvider: fork
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
- State is owned by the Harness session/subagent services; the plugin keeps no
  separate persistence and performs no network access.

## Verification

1. The **Plugins** page shows **Agent Manager** / **Менеджер агентов** and it
   is enabled.
2. Open any conversation: the header shows the **Agents** action with the
   plugin's icon. Opening it lists an empty state or existing child agents.
3. Create an agent from the panel (or with `/agent-manager create …`). It
   appears in the list with status `running` while its first turn executes.
4. Send a message to an agent; it wakes (or continues) and reports back. Use
   **Interrupt** on a running agent and confirm the turn stops.
5. `agent_manager_list` returns the same rows as the panel.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| The header action is missing | `headerAction: false`, or the panel is opened on the workspace start page without a conversation. |
| “The subagents service is unavailable” | The profile lacks the base subagent rows; reinstall/enable the base profile bundle. |
| “session ... is not live” | The session is closed; open it and retry. |
| Create succeeds but the agent never appears | The child failed provisioning; check the Host log for the subagent provider error. |
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
