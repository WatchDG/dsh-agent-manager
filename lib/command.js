/**
 * dsh-agent-manager — the `/agent-manager` command.
 *
 * The command is a thin, human-facing wrapper over the same manager facade
 * the tools and the Web panel use. It is deliberately simple:
 *
 *   /agent-manager                                   show this session's agents
 *   /agent-manager create <description> | <prompt>   create one agent
 *   /agent-manager create --provider=fork <...>      choose the backend
 */

/** Usage text shown on empty or malformed input. */
export const USAGE = [
  'Usage:',
  '  /agent-manager',
  '  /agent-manager create [--provider=spawn|fork] <description> | <prompt>',
  '',
  'Examples:',
  '  /agent-manager create Review the PR | Read F:\\git\\wdg\\dsh-agent-manager and summarize.',
].join('\n')

/**
 * Parse the command input.
 *
 * @param {string} rawInput Text after `/agent-manager`.
 * @returns {{ kind: 'status' } | { kind: 'usage' } | { kind: 'create', description: string, prompt: string, provider?: string }}
 */
export function parseCommand(rawInput) {
  const input = String(rawInput ?? '').trim()
  if (input.length === 0) return { kind: 'status' }

  const tokens = input.split(/\s+/)
  if (tokens[0] !== 'create') return { kind: 'usage' }

  let provider
  let rest = tokens.slice(1)
  const next = rest[0]
  if (next && next.startsWith('--provider=')) {
    const value = next.slice('--provider='.length)
    if (value !== 'spawn' && value !== 'fork') return { kind: 'usage' }
    provider = value
    rest = rest.slice(1)
  }
  const remaining = rest.join(' ')
  const separator = remaining.indexOf('|')
  if (separator < 0) return { kind: 'usage' }
  const description = remaining.slice(0, separator).trim()
  const prompt = remaining.slice(separator + 1).trim()
  if (description.length === 0 || prompt.length === 0) return { kind: 'usage' }
  return { kind: 'create', description, prompt, ...(provider === undefined ? {} : { provider }) }
}

/**
 * Format the status view for one session.
 *
 * @param {{ agents: Array<object>, total: number, team: object | null }} view
 * @returns {string}
 */
export function renderStatus(view) {
  const lines = [
    `Managed agents: ${view.total} child${view.total === 1 ? '' : 'ren'} in this session`,
  ]
  for (const agent of view.agents) {
    const state = agent.active ? 'running' : 'inactive'
    lines.push(`- ${agent.label ?? agent.id} [${state}, ${agent.mode}] ${agent.id}`)
  }
  if (view.truncated) lines.push(`- … ${view.total - view.agents.length} more (raise maxList or pass max)`)
  if (view.team) {
    lines.push('', `Agent Teams: ${view.team.members.length} member(s), ${view.team.tasks.length} shared task(s)`)
  } else {
    lines.push('', 'Agent Teams runtime is not mounted; only direct child agents are managed.')
  }
  return lines.join('\n')
}

/**
 * Execute the command through the manager facade.
 *
 * @param {{
 *   manager: { overview: Function, create: Function },
 *   getSettings: () => { memberProvider: 'spawn' | 'fork' },
 * }} deps
 * @param {object} invocation Command invocation (`agent`, `rawInput`).
 * @returns {{ kind: 'success', text: string } | { kind: 'error', text: string }}
 */
export async function executeCommand({ manager, getSettings }, invocation) {
  const parsed = parseCommand(invocation.rawInput)
  if (parsed.kind === 'usage') {
    return { kind: 'error', text: USAGE }
  }
  if (parsed.kind === 'status') {
    try {
      const view = await manager.overview(invocation.agent.id)
      return { kind: 'success', text: renderStatus(view) }
    } catch (error) {
      return { kind: 'error', text: String(error instanceof Error ? error.message : error) }
    }
  }
  try {
    const created = await manager.create({
      sessionId: invocation.agent.id,
      label: parsed.description,
      description: parsed.description,
      prompt: parsed.prompt,
      provider: parsed.provider ?? getSettings().memberProvider,
    })
    return {
      kind: 'success',
      text: `Created agent "${parsed.description}" (${created.provider}) with session id ${created.childId}.`,
    }
  } catch (error) {
    return { kind: 'error', text: String(error instanceof Error ? error.message : error) }
  }
}
