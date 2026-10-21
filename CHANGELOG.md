# Changelog

## [0.2.0] — 2026-10-21

- **Persistent agent definitions**: Settings → Agents keeps a durable,
  profile-global registry of agents (name, description, base prompt, backend)
  in `<workspace>/.agent-manager/state.json`.
- **Settings list is primary**: the agent list loads first; “Create agent”
  opens an inline form from the list; each row has Edit/Delete.
- **Spawn by task**: `agent_manager_spawn`, `/agent-manager run <agent> | <task>`,
  and the spawn block in Settings run a defined agent into any live session
  (base prompt + task in a new continuable child).
- Header panel now manages spawned children only (list, message, interrupt).
- New Host routes: `GET /agents/list`, `POST /agents/save`,
  `POST /agents/delete-agent`, `POST /agents/spawn`.

## [0.1.1] — 2026-10-21

- **Settings → Agents** now includes an agent creation/management block: pick
  a live session (new `GET /agents/sessions` route), enter name/description/
  prompt, create the agent, and see that session's managed agents. The same
  manager facade powers the header panel, tools, and command.
- Documentation updated to describe creation from Settings.

## [0.1.0] — 2026-10-21

Initial release.

- Conversation-header **Agents** panel: list managed child agents with live
  status, create (spawn/fork), message, interrupt, copy session id.
- Model-facing tools: `agent_manager_list`, `agent_manager_create`,
  `agent_manager_message`, `agent_manager_interrupt`.
- `/agent-manager` command with status and quick-create grammar.
- Settings → Agents page with volatile configuration (`memberProvider`,
  `maxList`, `headerAction`, `autoRefreshMs`, `toolsEnabled`).
- Optional Agent Teams integration: roster/task surfaces and
  `agent_manager_task_create/list/update` when `ctx.agentTeams` is mounted.
- Authenticated `/agents/*` Host routes for the Web panel.
- Locales: English and Russian; original SVG icon.
- Unit + manifest test suites and CI (Node 20/22/24 on Linux and Windows).
