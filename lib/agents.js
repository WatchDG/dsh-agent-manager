/**
 * dsh-agent-manager — pure agent-catalog mapping and request validation.
 *
 * Nothing in this module touches services or the filesystem, so it is fully
 * unit-testable and safe to call from tools, commands, and HTTP routes.
 */

/** Modes the subagent catalog can report. */
export const CATALOG_MODES = new Set(['one-shot', 'external', 'continuable', 'unknown'])

/** Durable mode labels surfaced to models and the UI. */
export const MODE_LABELS = {
  'one-shot': 'one-shot',
  external: 'external',
  continuable: 'continuable',
  unknown: 'unknown',
}

/**
 * Map one catalog entry to a plain view row.
 *
 * @param {object} entry `SubagentCatalogEntry` from `subagents.listChildren`.
 * @param {Map<string, unknown>} liveBySession Session id -> live Agent.
 * @returns {{
 *   id: string,
 *   label: string | null,
 *   mode: string,
 *   createdAt: number,
 *   live: boolean,
 *   active: boolean,
 * }}
 */
export function toChildView(entry, liveBySession) {
  const mode = CATALOG_MODES.has(entry.mode) ? entry.mode : 'unknown'
  const live = liveBySession.has(entry.id)
  return {
    id: entry.id,
    label: typeof entry.label === 'string' ? entry.label : null,
    mode: MODE_LABELS[mode] ?? 'unknown',
    createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : 0,
    live,
    active: live,
  }
}

/**
 * Project a child catalog into the response shape tools and routes share.
 *
 * @param {Array<object>} entries Catalog entries in parent event order.
 * @param {Map<string, unknown>} liveBySession Session id -> live Agent.
 * @param {number} limit Maximum rows kept (1..200).
 * @returns {{ agents: Array<object>, total: number, truncated: boolean }}
 */
export function catalogView(entries, liveBySession, limit) {
  const rows = entries.map((entry) => toChildView(entry, liveBySession))
  const total = rows.length
  const kept = rows.slice(0, limit)
  return { agents: kept, total, truncated: kept.length < total }
}

/**
 * Normalize a tool/UI provided child label.
 *
 * @param {unknown} value Raw value.
 * @param {number} maxLength Character cap.
 * @returns {string} trimmed label.
 */
export function requiredText(value, field, maxLength) {
  const text = String(value ?? '').trim()
  if (text.length === 0) throw new Error(`${field} must be non-empty`)
  if (text.length > maxLength) throw new Error(`${field} exceeds ${maxLength} characters`)
  return text
}

/**
 * Normalize a free-form initial prompt.
 *
 * @param {unknown} value Raw value.
 * @returns {string} trimmed prompt.
 */
export function requiredPrompt(value) {
  return requiredText(value, 'prompt', 20_000)
}

/**
 * Normalize a provider choice.
 *
 * @param {unknown} value Raw value.
 * @param {'spawn' | 'fork'} fallback Configured default.
 * @returns {'spawn' | 'fork'}
 */
export function normalizeProvider(value, fallback) {
  return value === 'fork' ? 'fork' : fallback === 'fork' ? 'fork' : 'spawn'
}

/** Model assignment modes for a persistent agent definition. */
export const MODEL_MODES = new Set(['inherit', 'auto', 'fixed'])

/**
 * Normalize how an agent obtains its child LLM route.
 *
 * @param {unknown} value Raw mode.
 * @returns {'inherit' | 'auto' | 'fixed'} a known mode (inherit by default).
 */
export function normalizeModelMode(value) {
  return MODEL_MODES.has(value) ? value : 'inherit'
}

/**
 * Normalize one exact provider/model pair.
 *
 * @param {unknown} provider Raw provider id.
 * @param {unknown} model Raw model id.
 * @returns {{ provider: string, model: string } | null} detached route, or null
 *   when either side is missing.
 */
export function normalizeModelRoute(provider, model) {
  const providerId = typeof provider === 'string' ? provider.trim() : ''
  const modelId = typeof model === 'string' ? model.trim() : ''
  if (providerId.length === 0 || modelId.length === 0) return null
  return { provider: providerId, model: modelId }
}

/**
 * Stable identity for one provider/model pair.
 *
 * @param {{ provider: string, model: string }} route Exact route.
 * @returns {string} opaque comparison key.
 */
export function modelRouteKey(route) {
  return `${route.provider}\u0000${route.model}`
}

/**
 * Normalize an ordered list of exact model routes.
 *
 * Invalid entries are dropped and duplicate provider/model pairs keep their
 * first position, so a Settings write cannot make activation fail later.
 *
 * @param {unknown} value Raw route list.
 * @returns {Array<{ provider: string, model: string }>} detached routes.
 */
export function normalizeModelRoutes(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const routes = []
  for (const candidate of value) {
    if (candidate === null || typeof candidate !== 'object') continue
    const route = normalizeModelRoute(candidate.provider, candidate.model)
    if (!route) continue
    const key = modelRouteKey(route)
    if (seen.has(key)) continue
    seen.add(key)
    routes.push(route)
  }
  return routes
}

/**
 * Parse a `provider/model` command-line route.
 *
 * @param {unknown} value Raw text.
 * @returns {{ provider: string, model: string } | null} route, or null when malformed.
 */
export function modelRouteFromString(value) {
  const text = String(value ?? '').trim()
  const separator = text.indexOf('/')
  if (separator <= 0 || separator === text.length - 1) return null
  return normalizeModelRoute(text.slice(0, separator), text.slice(separator + 1))
}

/**
 * Render one route for display and logs.
 *
 * @param {{ provider: string, model: string } | null | undefined} route Route.
 * @returns {string | null} `provider/model`, or null.
 */
export function formatModelRoute(route) {
  return route ? `${route.provider}/${route.model}` : null
}

/**
 * Read the route the parent session currently runs.
 *
 * The latest request header is authoritative after request-time model
 * selection; Agent creation options are the fallback before the first request.
 *
 * @param {object | undefined} parent Live parent Agent.
 * @returns {{ provider: string, model: string } | null} detached route, or null.
 */
export function parentModelRoute(parent) {
  try {
    const config = parent?.session?.requestHeader?.()?.config
    const fromRequest = normalizeModelRoute(config?.provider, config?.model)
    if (fromRequest) return fromRequest
  } catch {
    // A session without a readable request header falls back to creation options.
  }
  return normalizeModelRoute(parent?.options?.provider, parent?.options?.model)
}

/**
 * Resolve the child LLM route for one spawn.
 *
 * Precedence: a fixed definition always wins; an auto definition accepts the
 * coordinator's exact route when it is in the distribution list; everything
 * else inherits the session (no `agentOptions` is sent).
 *
 * @param {{
 *   modelMode: unknown,
 *   modelProvider: unknown,
 *   modelName: unknown,
 *   requestedProvider: unknown,
 *   requestedModel: unknown,
 *   allowedModels: unknown,
 * }} request Definition and coordinator choices.
 * @returns {{
 *   route: { provider: string, model: string } | null,
 *   source: 'agent' | 'coordinator' | 'session',
 * }} effective route and who selected it.
 */
export function resolveAgentModel(request) {
  const mode = normalizeModelMode(request.modelMode)
  const fixed = normalizeModelRoute(request.modelProvider, request.modelName)
  if (mode === 'fixed') {
    if (!fixed) {
      throw new Error('this agent uses a fixed model but has no provider/model configured')
    }
    return { route: fixed, source: 'agent' }
  }
  if (mode === 'auto') {
    const rawProvider =
      request.requestedProvider === undefined || request.requestedProvider === null
        ? ''
        : String(request.requestedProvider).trim()
    const rawModel =
      request.requestedModel === undefined || request.requestedModel === null
        ? ''
        : String(request.requestedModel).trim()
    if ((rawProvider.length === 0) !== (rawModel.length === 0)) {
      throw new Error('model_provider and model must be supplied together')
    }
    if (rawProvider.length === 0) return { route: null, source: 'session' }
    const requested = { provider: rawProvider, model: rawModel }
    const allowed = normalizeModelRoutes(request.allowedModels)
    if (allowed.length === 0) {
      throw new Error(
        'no distribution models are configured; omit model_provider/model to use the session model',
      )
    }
    const match = allowed.find(
      (route) => route.provider === requested.provider && route.model === requested.model,
    )
    if (!match) {
      const choices = allowed.map((route) => formatModelRoute(route)).join(', ')
      throw new Error(
        `model "${formatModelRoute(requested)}" is not available to the coordinator; choose one of: ${choices}`,
      )
    }
    return { route: match, source: 'coordinator' }
  }
  return { route: null, source: 'session' }
}

/**
 * Normalize an optional numeric list limit.
 *
 * @param {unknown} value Raw value.
 * @param {number} fallback Configured default.
 * @returns {number}
 */
export function normalizeLimit(value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), 200)
}

/**
 * Build the model-facing member rows for an optional Team roster.
 *
 * @param {Array<object> | undefined} members `TeamMemberView[]` rows, or none.
 * @returns {Array<object> | undefined} compact view rows.
 */
export function teamMembersView(members) {
  if (!Array.isArray(members)) return undefined
  return members.map((member) => ({
    name: member.name,
    role: member.role,
    status: member.status,
    ...(member.description !== undefined ? { description: member.description } : {}),
    ...(member.model !== undefined ? { model: member.model } : {}),
    ...(member.diagnostics?.length ? { diagnostics: member.diagnostics } : {}),
  }))
}

/**
 * Build the model-facing task rows for an optional Team board.
 *
 * @param {Array<object> | undefined} tasks `TeamTaskView[]` rows, or none.
 * @returns {Array<object> | undefined} compact view rows.
 */
export function teamTasksView(tasks) {
  if (!Array.isArray(tasks)) return undefined
  return tasks.map((task) => ({
    id: task.id,
    revision: task.revision,
    subject: task.subject,
    description: task.description,
    status: task.status,
    ready: task.ready === true,
    ...(task.ownerName !== undefined ? { ownerName: task.ownerName } : {}),
    blockedBy: Array.isArray(task.blockedBy) ? task.blockedBy : [],
    writeScopes: Array.isArray(task.writeScopes) ? task.writeScopes : [],
    writeScopeWarnings: Array.isArray(task.writeScopeWarnings) ? task.writeScopeWarnings : [],
  }))
}
