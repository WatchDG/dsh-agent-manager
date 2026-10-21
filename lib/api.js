/**
 * dsh-agent-manager — the manager facade over Host services.
 *
 * One operation, three callers: the model-facing tools, the `/agents/*`
 * HTTP routes behind the Web UI, and the `/agent-manager` command all funnel
 * through this facade, so behavior stays identical regardless of surface.
 *
 * The facade is built around the core `subagents` service (always present in
 * web/desktop profiles) and optionally enriches results with the Host's
 * Agent Teams service when that runtime is mounted (`ctx.agentTeams`).
 */

import {
  catalogView,
  normalizeLimit,
  normalizeProvider,
  requiredPrompt,
  requiredText,
  teamMembersView,
  teamTasksView,
} from './agents.js'

/** Timeout applied to UI/command initiated child activations. */
const ACTIVATION_TIMEOUT_MS = 120_000

/**
 * Build the manager for one plugin context.
 *
 * @param {{
 *   get: (name: string) => unknown,
 *   agents?: { get: (id: string) => unknown, list: () => Array<object> },
 *   logger?: { warn: (message: string) => void },
 * }} ctx Plugin context (host).
 * @param {() => {
 *   memberProvider: 'spawn' | 'fork',
 *   maxList: number,
 * }} getSettings Live settings reader.
 */
export function createAgentManager(ctx, getSettings) {
  const subagents = () => ctx.get('subagents')
  const teams = () => ctx.get('agentTeams')

  const requireSubagents = () => {
    const service = subagents()
    if (!service) throw new Error('the subagents service is unavailable in this profile')
    return service
  }

  /** Resolve the exact live parent agent for a session id. */
  const requireParent = (sessionId) => {
    const parent = ctx.agents?.get(sessionId)
    if (!parent) {
      throw new Error(`session "${sessionId}" is not live; open it so its agent is resident`)
    }
    return parent
  }

  /**
   * Resolve a message/interrupt target: a direct child id first, then a
   * teammate name when the Agent Teams service is available.
   */
  const resolveTarget = async (parent, sessionId, rawTarget) => {
    const target = requiredText(rawTarget, 'target', 200)
    const service = requireSubagents()
    const children = await service.listChildren(sessionId)
    if (children.some((child) => child.id === target)) return { kind: 'child', id: target }
    const teamsService = teams()
    if (teamsService) {
      try {
        const membership = teamsService.membership(parent)
        if (membership.role === 'lead') {
          const member = teamsService
            .listMembers(parent)
            .find((candidate) => candidate.role === 'teammate' && candidate.name === target)
          if (member) return { kind: 'teammate', name: target }
        }
      } catch {
        // The team runtime may reject non-member callers; fall through.
      }
    }
    throw new Error(
      `target "${target}" is not a direct child of this session${
        teamsService ? ' nor a teammate' : ' (the Agent Teams runtime is not mounted)'
      }`,
    )
  }

  /** Overview of the session's managed agents, with optional team data. */
  const overview = async (sessionId, options = {}) => {
    const service = requireSubagents()
    const parent = ctx.agents?.get(sessionId)
    const limit = normalizeLimit(options.limit, settings.maxList)
    const [entries, live] = await Promise.all([
      service.listChildren(sessionId),
      Promise.resolve(ctx.agents?.list() ?? []),
    ])
    const liveBySession = new Map(live.map((agent) => [agent.id, agent]))
    const catalog = catalogView(entries, liveBySession, limit)
    const result = { ...catalog, team: null }
    const teamsService = teams()
    if (teamsService && parent) {
      try {
        const membership = teamsService.membership(parent)
        if (membership) {
          result.team = {
            id: membership.id,
            role: membership.role,
            name: membership.name,
            members: teamMembersView(teamsService.listMembers(parent)) ?? [],
            tasks: teamTasksView(teamsService.listTasks(parent)) ?? [],
          }
        }
      } catch {
        result.team = null
      }
    }
    return result
  }

  /** Create one continuable direct child agent under the session. */
  const create = async ({ sessionId, label, description, prompt, provider }) => {
    const service = requireSubagents()
    const parent = requireParent(sessionId)
    const name = requiredText(label, 'label', 80)
    const summary = requiredText(description, 'description', 200)
    const promptText = requiredPrompt(prompt)
    const providerName = normalizeProvider(provider, getSettings().memberProvider)
    const signal = AbortSignal.timeout(ACTIVATION_TIMEOUT_MS)
    const activation = await service.startActivation({
      provider: providerName,
      label: summary,
      request: {
        prompt: [{ type: 'text', text: promptText }],
        parent,
      },
      signal,
      delivery: 'parent',
    })
    return { childId: activation.childId, label: name, description: summary, provider: providerName }
  }

  /** Deliver a message to a child agent (or teammate). */
  const send = async ({ sessionId, target, message }) => {
    const service = requireSubagents()
    const parent = requireParent(sessionId)
    const text = requiredText(message, 'message', 20_000)
    const resolved = await resolveTarget(parent, sessionId, target)
    const signal = new AbortController().signal
    if (resolved.kind === 'teammate') {
      const teamsService = teams()
      const result = await teamsService.sendMessage(parent, {
        target: resolved.name,
        content: [{ type: 'text', text }],
        signal,
      })
      return { messageId: result.messageId, target: resolved.name }
    }
    const messageId = await service.sendMessage(parent, resolved.id, [{ type: 'text', text }], { signal })
    return { messageId, target: resolved.id }
  }

  /** Interrupt a child agent (or teammate). */
  const interrupt = async ({ sessionId, target }) => {
    const service = requireSubagents()
    const parent = requireParent(sessionId)
    const resolved = await resolveTarget(parent, sessionId, target)
    if (resolved.kind === 'teammate') {
      const teamsService = teams()
      return teamsService.interrupt(parent, resolved.name)
    }
    service.interrupt(resolved.id, { kind: 'ancestor', agent: parent })
    return { accepted: true }
  }

  return { overview, create, send, interrupt }
}
