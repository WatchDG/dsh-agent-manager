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

/** Maximum length of a steered instructions update. */
const MAX_INSTRUCTIONS = 20_000

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
 * @param {{
 *   annotate: (id: string, patch: object) => void,
 *   remove: (id: string) => void,
 *   snapshot: () => { annotations: Record<string, object>, deleted: string[] },
 * }} store Plugin-local state (annotations and tombstones).
 */
export function createAgentManager(ctx, getSettings, store) {
  /** get() may throw for un-injected services; treat as absent. */
  const safeGet = (name) => {
    try {
      return ctx.get(name)
    } catch {
      return undefined
    }
  }
  const subagents = () => safeGet('subagents')
  const teams = () => safeGet('agentTeams')

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
    const limit = normalizeLimit(options.limit, getSettings().maxList)
    const [entries, live] = await Promise.all([
      service.listChildren(sessionId),
      Promise.resolve(ctx.agents?.list() ?? []),
    ])
    const liveBySession = new Map(live.map((agent) => [agent.id, agent]))
    const catalog = catalogView(entries, liveBySession, limit)
    const state = store.snapshot()
    const deleted = new Set(state.deleted)
    const agents = catalog.agents
      .filter((row) => !deleted.has(row.id))
      .map((row) => {
        const annotation = state.annotations[row.id]
        if (!annotation) return row
        return {
          ...row,
          ...(typeof annotation.label === 'string' && annotation.label ? { label: annotation.label } : {}),
          ...(typeof annotation.description === 'string' && annotation.description ? { description: annotation.description } : {}),
        }
      })
    const result = { ...catalog, agents, team: null }
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

  /** List the persistent agent definitions from the plugin registry. */
  const listAgents = () => {
    const agents = store
      .listAgents()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        prompt: agent.prompt,
        provider: agent.provider,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }))
    return { agents }
  }

  /**
   * Create or update one persistent agent definition. Definitions live in
   * the plugin registry (profile-global) and can be spawned from any session.
   */
  const saveAgent = ({ id, name, description, prompt, provider }) => {
    const next = store.saveAgent({
      id,
      name: requiredText(name, 'name', 80),
      description: requiredText(description, 'description', 200),
      prompt: requiredPrompt(prompt),
      provider: normalizeProvider(provider, getSettings().memberProvider),
    })
    return next
  }

  /** Delete one persistent agent definition. */
  const deleteAgent = (id) => {
    const clean = requiredText(id, 'agent id', 200)
    store.deleteAgent(clean)
    return { id: clean, deleted: true }
  }

  /**
   * Spawn a persistent agent definition into a session. The agent's base
   * prompt is combined with the requested task, and a continuable child
   * session starts immediately under the target session.
   */
  const spawn = async ({ sessionId, agentId, task, provider, context }) => {
    const service = requireSubagents()
    const parent = requireParent(sessionId)
    const definition = store.getAgent(requiredText(agentId, 'agent id', 200))
    if (!definition) throw new Error(`agent "${agentId}" is not defined; create it in Settings first`)
    const taskText = requiredPrompt(task)
    const providerName = normalizeProvider(provider, definition.provider ?? getSettings().memberProvider)
    const promptText = [definition.prompt, `Задача: ${taskText}`].filter(Boolean).join('\n\n')
    const signal = AbortSignal.timeout(ACTIVATION_TIMEOUT_MS)
    const activation = await service.startActivation({
      provider: providerName,
      label: definition.description,
      request: {
        prompt: [{ type: 'text', text: promptText }],
        parent,
      },
      signal,
      delivery: 'parent',
    })
    store.annotate(activation.childId, { label: definition.name, description: definition.description })
    return {
      childId: activation.childId,
      agentId: definition.id,
      name: definition.name,
      task: taskText,
      provider: providerName,
    }
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

  /**
   * Update a managed child: rename/annotate it in the plugin registry and,
   * when instructions are provided, steer them to the agent as a follow-up
   * message.
   */
  const update = async ({ sessionId, target, label, description, instructions }) => {
    const service = requireSubagents()
    const parent = requireParent(sessionId)
    const resolved = await resolveTarget(parent, sessionId, target)
    if (resolved.kind !== 'child') throw new Error('only child agents can be edited')
    const id = resolved.id

    const patch = {}
    if (label !== undefined) patch.label = requiredText(label, 'label', 80)
    if (description !== undefined) patch.description = requiredText(description, 'description', 200)
    if (Object.keys(patch).length > 0) store.annotate(id, patch)

    let messageId = null
    if (instructions !== undefined) {
      const text = requiredText(instructions, 'instructions', MAX_INSTRUCTIONS)
      const sent = await service.sendMessage(parent, id, [{ type: 'text', text }], { signal: new AbortController().signal })
      messageId = typeof sent?.messageId === 'string' ? sent.messageId : null
    }
    return { id, updated: true, messageId }
  }

  /**
   * Remove a managed child from the Settings list: release its resident
   * activation (best effort) and record a tombstone in the plugin registry.
   * The underlying session stays on disk and can be reopened from the Host.
   */
  const remove = async ({ sessionId, target }) => {
    const service = requireSubagents()
    const parent = requireParent(sessionId)
    const resolved = await resolveTarget(parent, sessionId, target)
    if (resolved.kind !== 'child') throw new Error('only child agents can be removed')
    try {
      await service.drainChildren(parent, [resolved.id])
    } catch (error) {
      ctx.logger?.warn?.(`agent-manager: drain of ${resolved.id} failed: ${String(error)}`)
    }
    store.remove(resolved.id)
    return { id: resolved.id, removed: true }
  }

  return { overview, listAgents, saveAgent, deleteAgent, spawn, send, interrupt, update, remove }
}
