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
