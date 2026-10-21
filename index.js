/**
 * dsh-agent-manager — create and manage agents for a DeepSeek Harness
 * session: sub-agents (spawn/fork), direct messaging, interrupts, and a
 * live Web panel, with optional Agent Teams roster and task-board integration
 * when the Host team runtime is mounted.
 *
 * Contributions, all owned by this plugin's context:
 *
 * 1. **Tools** — `agent_manager_list`, `agent_manager_spawn`,
 *    `agent_manager_list_models`, `agent_manager_message`,
 *    `agent_manager_interrupt` (plus the `agent_manager_task_*` board when
 *    `ctx.agentTeams` is present). Every operation funnels through one manager
 *    facade shared with the UI.
 * 2. **Command** — `/agent-manager` for status and spawning a defined agent.
 * 3. **Web panel** — an “Agents” action in the conversation header that
 *    lists managed children and lets you message and interrupt them.
 *    The Host serves it over authenticated `/agents/*` routes.
 * 4. **Settings page** — the configuration below, editable live.
 *
 * Config (all optional, read from the bundle row, editable live from the
 * Settings page thanks to volatile fields):
 *
 *   memberProvider  'spawn' | 'fork'   default backend for new agents
 *   allowedModels   ModelRoute[]        coordinator distribution routes
 *   maxList         number              max child rows in listings
 *   headerAction     boolean             show the conversation-header action
 *   autoRefreshMs    number              panel auto-refresh interval
 *   toolsEnabled     boolean             register the agent_manager_* tools
 */

import { Config, snapshot } from './lib/config.js'
import { mount } from './lib/plugin.js'

/**
 * Activate the plugin for one profile context.
 *
 * @param {object} ctx Plugin context supplied by the DSH loader.
 * @param {unknown} config Bundle row config.
 */
export function apply(ctx, config) {
  mount(ctx, config)
}

export { Config }
export const name = 'agent-manager'
export const inject = ['tools', 'subagents', 'agents', 'systemPrompt', 'commands']
