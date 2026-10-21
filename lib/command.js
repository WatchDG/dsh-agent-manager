/**
 * dsh-agent-manager — the `/agent-manager` command.
 *
 * The command is a thin, human-facing wrapper over the same manager facade
 * the tools and the Web panel use. It is deliberately simple:
 *
 *   /agent-manager                                        show agents and definitions
 *   /agent-manager run <agent> | <task>                   spawn a defined agent
 *   /agent-manager run --session <id> <agent> | <task>    spawn into another session
 *   /agent-manager run --model <provider>/<model> …       choose an auto-mode route
 */

import { modelRouteFromString } from './agents.js'

/** Usage text shown on empty or malformed input. */
export const USAGE = [
  'Usage:',
  '  /agent-manager',
  '  /agent-manager run [--session <session-id>] [--model <provider>/<model>] <agent-name-or-id> | <task>',
  '',
  'The optional --model route is honored only by auto-mode agents and must be one',
  'of the configured distribution models. Fixed agents always use their own model;',
  'inherit agents use the session model.',
  '',
  'Examples:',
  '  /agent-manager run reviewer | Review the latest commit.',
  '  /agent-manager run --session session-42 writer | Draft the release notes.',
  '  /agent-manager run --model openai/gpt-5 reviewer | Review the latest commit.',
].join('\n')

/**
 * Parse the command input.
 *
 * @param {string} rawInput Text after `/agent-manager`.
 * @returns {{
 *   kind: 'status',
 * } | {
 *   kind: 'usage',
 * } | {
 *   kind: 'run',
 *   agent: string,
 *   task: string,
 *   session?: string,
 *   modelProvider?: string,
 *   modelName?: string,
 * }}
 */
export function parseCommand(rawInput) {
  const input = String(rawInput ?? '').trim()
  if (input.length === 0) return { kind: 'status' }

  const tokens = input.split(/\s+/)
  if (tokens[0] !== 'run') return { kind: 'usage' }

  let session
  let model
  let rest = tokens.slice(1)
  while (rest.length > 0 && rest[0].startsWith('--')) {
    const token = rest[0]
    if (token === '--session') {
      if (rest.length < 2) return { kind: 'usage' }
      session = rest[1]
      rest = rest.slice(2)
      continue
    }
    if (token.startsWith('--session=')) {
      session = token.slice('--session='.length)
      rest = rest.slice(1)
      continue
    }
    if (token === '--model') {
      if (rest.length < 2) return { kind: 'usage' }
      model = modelRouteFromString(rest[1])
      if (!model) return { kind: 'usage' }
      rest = rest.slice(2)
      continue
    }
    if (token.startsWith('--model=')) {
      model = modelRouteFromString(token.slice('--model='.length))
      if (!model) return { kind: 'usage' }
      rest = rest.slice(1)
      continue
    }
    return { kind: 'usage' }
  }
  if (session !== undefined && session.length === 0) return { kind: 'usage' }
  const remaining = rest.join(' ')
  const separator = remaining.indexOf('|')
  if (separator < 0) return { kind: 'usage' }
  const agent = remaining.slice(0, separator).trim()
  const task = remaining.slice(separator + 1).trim()
  if (agent.length === 0 || task.length === 0) return { kind: 'usage' }
  return {
    kind: 'run',
    agent,
    task,
    ...(session === undefined ? {} : { session }),
    ...(model === undefined || model === null ? {} : { modelProvider: model.provider, modelName: model.model }),
  }
}

/**
 * Format the status view for one session.
 *
 * @param {{ agents: Array<object>, total: number, team: object | null, definitions: Array<object> }} view
 * @returns {string}
 */
export function renderStatus(view) {
  const lines = [`Defined agents: ${view.definitions?.length ?? 0}`]
  for (const definition of view.definitions ?? []) {
    const mode = definition.modelMode ?? 'inherit'
    const model =
      mode === 'fixed' && definition.modelProvider && definition.modelName
        ? ` ${definition.modelProvider}/${definition.modelName}`
        : mode === 'auto'
          ? ' auto'
          : ' inherit'
    lines.push(`- ${definition.name} [${definition.provider}, model:${model}] — ${definition.description}`)
  }
  lines.push('', `Spawned children: ${view.total} in this session`)
  for (const agent of view.agents) {
    const state = agent.active ? 'running' : 'inactive'
    const model = agent.model ? `, ${agent.model}` : ''
    lines.push(`- ${agent.label ?? agent.id} [${state}, ${agent.mode}${model}] ${agent.id}`)
  }
  if (view.truncated) lines.push(`- … ${view.total - view.agents.length} more (raise maxList or pass max)`)
  if (view.team) {
    lines.push('', `Agent Teams: ${view.team.members.length} member(s), ${view.team.tasks.length} shared task(s)`)
  }
  return lines.join('\n')
}

/**
 * Execute the command through the manager facade.
 *
 * @param {{
 *   manager: { overview: Function, listAgents: Function, spawn: Function },
 * }} deps
 * @param {object} invocation Command invocation (`agent`, `rawInput`).
 * @returns {{ kind: 'success', text: string } | { kind: 'error', text: string }}
 */
export async function executeCommand({ manager }, invocation) {
  const parsed = parseCommand(invocation.rawInput)
  if (parsed.kind === 'usage') {
    return { kind: 'error', text: USAGE }
  }
  if (parsed.kind === 'status') {
    try {
      const view = await manager.overview(invocation.agent.id)
      return { kind: 'success', text: renderStatus({ ...view, definitions: manager.listAgents().agents }) }
    } catch (error) {
      return { kind: 'error', text: String(error instanceof Error ? error.message : error) }
    }
  }
  try {
    const spawned = await manager.spawn({
      sessionId: parsed.session ?? invocation.agent.id,
      agentId: parsed.agent,
      task: parsed.task,
      modelProvider: parsed.modelProvider,
      modelName: parsed.modelName,
    })
    return {
      kind: 'success',
      text: `Spawned "${spawned.name}" with session id ${spawned.childId} (${spawned.provider}).`,
    }
  } catch (error) {
    return { kind: 'error', text: String(error instanceof Error ? error.message : error) }
  }
}
