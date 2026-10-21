/**
 * dsh-agent-manager — configuration normalization and the settings schema.
 *
 * The bundle row's `config` is user-authored YAML, so every field is optional
 * and every value is validated here, at activation, instead of at each call.
 *
 * `Config` is the same shape as a schema: the settings service serves only
 * volatile fields, so the Settings page can rewrite them while the plugin
 * stays loaded. `snapshot()` unwraps those live references back into the
 * plain values the tools, the routes, and the client ask for.
 */

import z from '@deepseek-ai/schemastery'

/** System-prompt section name owned by this plugin. */
export const PROTOCOL_SECTION = 'agent-manager:rules'

/** Default sub-agent backend used by `agent_manager_create` and the UI. */
export const DEFAULT_PROVIDER = 'spawn'

/** Default cap on child rows in tool and HTTP listings. */
export const DEFAULT_MAX_LIST = 50

/** Default panel auto-refresh interval. */
export const DEFAULT_AUTO_REFRESH_MS = 5000

/** Limits enforced by `snapshot`/`normalizeConfig`. */
export const MAX_LIST_LIMIT = 200
export const MAX_AUTO_REFRESH_MS = 60_000
export const MIN_AUTO_REFRESH_MS = 1_000

/**
 * Runtime configuration.
 *
 * `.volatile()` is what makes the Settings page work: the settings service
 * exposes only volatile fields, and a write replaces the reference in place
 * instead of remounting the plugin.
 */
export const Config = z.object({
  memberProvider: z.union(['spawn', 'fork']).default(DEFAULT_PROVIDER).volatile(),
  maxList: z.number().min(1).max(MAX_LIST_LIMIT).default(DEFAULT_MAX_LIST).volatile(),
  headerAction: z.boolean().default(true).volatile(),
  autoRefreshMs: z
    .number()
    .min(MIN_AUTO_REFRESH_MS)
    .max(MAX_AUTO_REFRESH_MS)
    .default(DEFAULT_AUTO_REFRESH_MS)
    .volatile(),
  toolsEnabled: z.boolean().default(true).volatile(),
})

/**
 * Read one Config field, tolerating a plain value when the schema is parsed
 * without the volatile wrapper (tests, older readers).
 *
 * @param {unknown} value Stored field value or volatile reference.
 * @param {unknown} fallback Value when nothing usable is stored.
 * @returns {unknown} the stored choice.
 */
function live(value, fallback) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    try {
      const current = value.get()
      return current === undefined ? fallback : current
    } catch {
      return fallback
    }
  }
  return value === undefined ? fallback : value
}

/**
 * Unwrap volatile Config references into a plain object `normalizeConfig`
 * accepts, then normalize. Call it on every use, not once at activation:
 * the Settings page may replace a field between two calls.
 *
 * @param {unknown} raw Plugin Config with optional volatile references.
 * @returns {{
 *   memberProvider: 'spawn' | 'fork',
 *   maxList: number,
 *   headerAction: boolean,
 *   autoRefreshMs: number,
 *   toolsEnabled: boolean,
 * }}
 */
export function snapshot(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {}
  return normalizeConfig({
    memberProvider: live(source.memberProvider, undefined),
    maxList: live(source.maxList, undefined),
    headerAction: live(source.headerAction, undefined),
    autoRefreshMs: live(source.autoRefreshMs, undefined),
    toolsEnabled: live(source.toolsEnabled, undefined),
  })
}

/**
 * Normalize the loader row's config.
 *
 * @param {unknown} raw Value from the bundle row (`config` in the patch layer).
 * @returns {{
 *   memberProvider: 'spawn' | 'fork',
 *   maxList: number,
 *   headerAction: boolean,
 *   autoRefreshMs: number,
 *   toolsEnabled: boolean,
 * }}
 */
export function normalizeConfig(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {}
  return {
    memberProvider: source.memberProvider === 'fork' ? 'fork' : 'spawn',
    maxList:
      Number.isFinite(source.maxList) && source.maxList >= 1
        ? Math.min(Math.floor(source.maxList), MAX_LIST_LIMIT)
        : DEFAULT_MAX_LIST,
    headerAction: source.headerAction !== false,
    autoRefreshMs:
      Number.isFinite(source.autoRefreshMs)
        ? Math.min(Math.max(Math.round(source.autoRefreshMs), MIN_AUTO_REFRESH_MS), MAX_AUTO_REFRESH_MS)
        : DEFAULT_AUTO_REFRESH_MS,
    toolsEnabled: source.toolsEnabled !== false,
  }
}
