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
  formatModelRoute,
  modelRouteKey,
  normalizeLimit,
  normalizeModelMode,
  normalizeModelRoute,
  normalizeModelRoutes,
  normalizeProvider,
  parentModelRoute,
  requiredPrompt,
  requiredText,
  resolveAgentModel,
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
   * Exact routes the coordinator may hand out.
   *
   * An explicit plugin list overrides the Host's Subagent model-selection
   * policy. With neither configured there is no distribution choice and every
   * child inherits the session model.
   */
  const distributionPolicy = () => {
    const configured = normalizeModelRoutes(getSettings().allowedModels)
    if (configured.length > 0) return { source: 'config', routes: configured }
    const selection = safeGet('subagentModelSelection')
    if (selection && typeof selection.current === 'function') {
      try {
        const current = selection.current()
        const routes = normalizeModelRoutes(current?.allowedModels)
        if (current?.enabled === true && routes.length > 0) return { source: 'host', routes }
      } catch {
        // An invalid Host policy falls back to session inheritance; it must not
        // break agent management.
      }
    }
    return { source: 'session', routes: [] }
  }

  /**
   * Read the coordinator's distribution routes plus the advertised LLM
   * catalog. `scope: 'allowed'` is the model-facing list; `scope: 'all'`
   * also returns every advertised route for the Settings picker.
   */
  const listModels = async ({ sessionId, scope = 'allowed' } = {}) => {
    const policy = distributionPolicy()
    const llm = safeGet('llm')
    const parent = sessionId ? ctx.agents?.get(sessionId) : undefined
    const providers = []
    const advertised = []
    if (llm && typeof llm.listProviders === 'function' && typeof llm.listModels === 'function') {
      let registered = []
      try {
        registered = llm.listProviders() ?? []
      } catch {
        registered = []
      }
      for (const provider of registered) {
        if (!provider || typeof provider.id !== 'string') continue
        providers.push({
          provider: provider.id,
          name:
            typeof provider.name === 'string' && provider.name.length > 0
              ? provider.name
              : provider.id,
          available: true,
        })
        let models = []
        try {
          models = (await llm.listModels(provider.id)) ?? []
        } catch {
          models = []
        }
        for (const model of models) {
          if (!model || typeof model.id !== 'string') continue
          advertised.push({
            provider: provider.id,
            model: model.id,
            name: typeof model.name === 'string' && model.name.length > 0 ? model.name : model.id,
            ...(typeof model.description === 'string' && model.description.length > 0
              ? { description: model.description }
              : {}),
            available: true,
          })
        }
      }
    }

    const advertisedByKey = new Map(advertised.map((row) => [modelRouteKey(row), row]))
    const allowedModels = policy.routes.map((route) => {
      const found = advertisedByKey.get(modelRouteKey(route))
      return found
        ? { ...found, provider: route.provider, model: route.model }
        : {
            provider: route.provider,
            model: route.model,
            name: route.model,
            available: false,
          }
    })

    for (const route of policy.routes) {
      if (!providers.some((row) => row.provider === route.provider)) {
        providers.push({ provider: route.provider, name: route.provider, available: false })
      }
    }

    const visibleProviders =
      scope === 'all'
        ? [...providers].sort((a, b) => a.provider.localeCompare(b.provider))
        : providers
            .filter((row) => policy.routes.some((route) => route.provider === row.provider))
            .sort((a, b) => a.provider.localeCompare(b.provider))

    const models =
      scope === 'all'
        ? [
            ...advertised,
            ...allowedModels.filter((row) => !advertisedByKey.has(modelRouteKey(row))),
          ].sort((a, b) => `${a.provider}/${a.model}`.localeCompare(`${b.provider}/${b.model}`))
        : allowedModels

    return {
      available: llm !== undefined,
      source: policy.source,
      providers: visibleProviders,
      allowedModels,
      models,
      sessionModel: parentModelRoute(parent),
    }
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
          ...(typeof annotation.description === 'string' && annotation.description
            ? { description: annotation.description }
            : {}),
          ...(typeof annotation.model === 'string' && annotation.model ? { model: annotation.model } : {}),
          ...(typeof annotation.modelSource === 'string' && annotation.modelSource
            ? { modelSource: annotation.modelSource }
            : {}),
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
        modelMode: agent.modelMode,
        modelProvider: agent.modelProvider,
        modelName: agent.modelName,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      }))
    return { agents }
  }

  /**
   * Create or update one persistent agent definition. Definitions live in
   * the plugin registry (profile-global) and can be spawned from any session.
   */
  const saveAgent = ({ id, name, description, prompt, provider, modelMode, modelProvider, modelName }) => {
    const mode = normalizeModelMode(modelMode)
    const fixed = mode === 'fixed' ? normalizeModelRoute(modelProvider, modelName) : null
    if (mode === 'fixed' && !fixed) {
      throw new Error('fixed model mode requires both modelProvider and modelName')
    }
    const next = store.saveAgent({
      id,
      name: requiredText(name, 'name', 80),
      description: requiredText(description, 'description', 200),
      prompt: requiredPrompt(prompt),
      provider: normalizeProvider(provider, getSettings().memberProvider),
      modelMode: mode,
      modelProvider: fixed?.provider ?? null,
      modelName: fixed?.model ?? null,
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
  const spawn = async ({
    sessionId,
    agentId,
    task,
    provider,
    modelProvider,
    modelName,
    context,
  }) => {
    const service = requireSubagents()
    const parent = requireParent(sessionId)
    const definition = store.getAgent(requiredText(agentId, 'agent id', 200))
    if (!definition) throw new Error(`agent "${agentId}" is not defined; create it in Settings first`)
    const taskText = requiredPrompt(task)
    const providerName = normalizeProvider(provider, definition.provider ?? getSettings().memberProvider)
    const policy = distributionPolicy()
    const model = resolveAgentModel({
      modelMode: definition.modelMode,
      modelProvider: definition.modelProvider,
      modelName: definition.modelName,
      requestedProvider: modelProvider,
      requestedModel: modelName,
      allowedModels: policy.routes,
    })
    const effectiveModel = model.route ?? (model.source === 'session' ? parentModelRoute(parent) : null)
    const promptText = [definition.prompt, `Задача: ${taskText}`].filter(Boolean).join('\n\n')
    const signal = AbortSignal.timeout(ACTIVATION_TIMEOUT_MS)
    const activation = await service.startActivation({
      provider: providerName,
      label: definition.description,
      request: {
        prompt: [{ type: 'text', text: promptText }],
        parent,
        ...(model.route
          ? { agentOptions: { provider: model.route.provider, model: model.route.model } }
          : {}),
      },
      signal,
      delivery: 'parent',
    })
    store.annotate(activation.childId, {
      label: definition.name,
      description: definition.description,
      ...(effectiveModel ? { model: formatModelRoute(effectiveModel) } : {}),
      modelSource: model.source,
    })
    return {
      childId: activation.childId,
      agentId: definition.id,
      name: definition.name,
      task: taskText,
      provider: providerName,
      modelMode: normalizeModelMode(definition.modelMode),
      model: formatModelRoute(effectiveModel),
      modelSource: model.source,
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

  return { overview, listAgents, listModels, saveAgent, deleteAgent, spawn, send, interrupt, update, remove }
}
