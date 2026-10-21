# Changelog

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
