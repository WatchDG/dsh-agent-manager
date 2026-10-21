# Changelog

## [0.3.0] — 2026-10-21

- **Per-agent model selection.** Each persistent definition now carries a model
  mode: `inherit` (use the spawning session’s model), `auto` (the coordinator
  chooses an exact route at spawn time), or `fixed` (always use the definition’s
  own provider/model). A fixed agent ignores the coordinator’s route; an auto
  agent falls back to the session model when no route is chosen.
- **Coordinator distribution models.** The new `allowedModels` setting lists the
  exact routes the coordinator may assign to auto-mode agents. When the plugin
  list is empty, the Host `subagent-model-selection` policy is used; when that is
  empty too, agents inherit the session model.
- **Model discovery and overrides.** `agent_manager_list_models` exposes the
  coordinator’s allowed routes, and `agent_manager_spawn` accepts optional
  `model_provider` / `model` fields for auto-mode definitions. `/agent-manager
  run --model <provider>/<model>` supports the same choice from chat.
- **Settings UI.** The agent form has a model-mode selector plus provider and
  model lists for fixed agents; the Settings page gains a distribution-model
  picker backed by the live LLM catalog, with provider/model lists for adding
  routes. Spawned children show their effective model.
- **Host fallback and validation.** The manager reads the Host
  `subagent-model-selection` service without requiring it, validates coordinator
  choices against the effective list, and passes the route through the
  subagent `agentOptions` seam.

## [0.2.1] — 2026-10-21

- **Fix: every model-facing tool was rejected by the provider.** Definitions
  registered their author-facing parameter descriptors, but the tool registry
  forwards `parameters` to the model verbatim, so each call failed with
  `Invalid schema for function 'agent_manager_*': schema must be a JSON Schema
  of 'type: "object"', got 'type: null'`. `lib/tools.js` now compiles the
  descriptors into raw JSON Schema — object root, property schemas, and a
  top-level `required` array — before registration.

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
