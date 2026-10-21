/**
 * dsh-agent-manager — plugin-local persistent agent registry.
 *
 * This is the durable home of the agent definitions created in Settings:
 * name, description, base prompt, and default provider. Definitions are
 * profile-global (shared by every session), stored as JSON under
 * `<workspace>/.agent-manager/state.json`, and survive Host restarts.
 *
 * The same file also keeps the plugin's instance metadata: display
 * annotations for spawned children and "removed from the managed list"
 * tombstones.
 */

import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { normalizeModelMode, normalizeModelRoute } from './agents.js'

/** Normalize one agent definition before persistence. */
function normalizeAgent(agent) {
  const route = normalizeModelRoute(agent.modelProvider, agent.modelName)
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    prompt: agent.prompt,
    provider: agent.provider,
    modelMode: normalizeModelMode(agent.modelMode),
    modelProvider: route?.provider ?? null,
    modelName: route?.model ?? null,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  }
}

/**
 * Create the store for one plugin activation.
 *
 * @param {() => string} getDir Resolves the directory that should own the
 *   state file (the Host working directory).
 * @returns {{
 *   listAgents: () => Array<object>,
 *   getAgent: (id: string) => object | undefined,
 *   saveAgent: (agent: object) => object,
 *   deleteAgent: (id: string) => void,
 *   annotate: (id: string, patch: object) => void,
 *   remove: (id: string) => void,
 *   snapshot: () => { annotations: Record<string, object>, deleted: string[] },
 * }}
 */
export function createAgentStore(getDir) {
  let cache
  let file

  const load = () => {
    if (cache) return cache
    file = path.join(getDir(), '.agent-manager', 'state.json')
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
      cache = parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      cache = {}
    }
    if (!Array.isArray(cache.deleted)) cache.deleted = []
    if (!cache.annotations || typeof cache.annotations !== 'object') cache.annotations = {}
    if (!cache.agents || typeof cache.agents !== 'object') cache.agents = {}
    return cache
  }

  const persist = () => {
    try {
      const state = load()
      fs.mkdirSync(path.dirname(file), { recursive: true })
      const tmp = `${file}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
      fs.renameSync(tmp, file)
    } catch {
      // Best effort: the registry must never break management on IO failure.
    }
  }

  const listAgents = () => {
    const state = load()
    return Object.values(state.agents).map(normalizeAgent)
  }

  const getAgent = (id) => {
    const agent = load().agents[id]
    return agent ? normalizeAgent(agent) : undefined
  }

  const saveAgent = (agent) => {
    const state = load()
    const now = Date.now()
    const id = agent.id ?? randomUUID()
    const existing = state.agents[id]
    const route = normalizeModelRoute(agent.modelProvider, agent.modelName)
    const next = {
      id,
      name: agent.name,
      description: agent.description,
      prompt: agent.prompt,
      provider: agent.provider,
      modelMode: normalizeModelMode(agent.modelMode),
      modelProvider: route?.provider ?? null,
      modelName: route?.model ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    state.agents[id] = next
    persist()
    return normalizeAgent(next)
  }

  const deleteAgent = (id) => {
    const state = load()
    if (state.agents[id]) {
      delete state.agents[id]
      persist()
    }
  }

  const annotate = (id, patch) => {
    const state = load()
    state.annotations[id] = { ...(state.annotations[id] ?? {}), ...patch }
    persist()
  }

  const remove = (id) => {
    const state = load()
    if (!state.deleted.includes(id)) state.deleted.push(id)
    persist()
  }

  const snapshot = () => {
    const state = load()
    return {
      annotations: { ...state.annotations },
      deleted: [...state.deleted],
    }
  }

  return { listAgents, getAgent, saveAgent, deleteAgent, annotate, remove, snapshot }
}
