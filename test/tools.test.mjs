// Model-facing tool definitions: shape, guards, and delegation to the manager.
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildManagerTools, buildTeamTools } from '../lib/tools.js'

const agent = { id: 'session-1' }
const exec = { agent, signal: new AbortController().signal }

function jsonText(definition, value) {
  return definition.output.render({}, value)
}

test('buildManagerTools produces the four core definitions', () => {
  const tools = buildManagerTools({
    manager: {},
    settings: { maxList: () => 50, memberProvider: () => 'spawn' },
  })
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ['agent_manager_list', 'agent_manager_create', 'agent_manager_message', 'agent_manager_interrupt'],
  )
  for (const tool of tools) {
    assert.equal(typeof tool.execute, 'function')
    assert.equal(typeof tool.description, 'string')
    assert.ok(tool.description.length > 0)
    assert.ok(tool.output && tool.output.schema && typeof tool.output.render === 'function')
  }
})

test('tools request the calling agent', async () => {
  const tools = buildManagerTools({
    manager: {},
    settings: { maxList: () => 50, memberProvider: () => 'spawn' },
  })
  for (const tool of tools) {
    await assert.rejects(tool.execute({}, { agent: undefined, signal: exec.signal }), /requires a calling agent/)
  }
})

test('agent_manager_list delegates to the manager overview with a default limit', async () => {
  const calls = []
  const tools = buildManagerTools({
    manager: {
      overview: async (sessionId, options) => {
        calls.push({ sessionId, options })
        return { agents: [], total: 0, truncated: false, team: null }
      },
    },
    settings: { maxList: () => 42, memberProvider: () => 'spawn' },
  })
  const list = tools.find((tool) => tool.name === 'agent_manager_list')
  const value = await list.execute({}, exec)
  assert.deepEqual(calls, [{ sessionId: agent.id, options: { limit: 42 } }])
  assert.deepEqual(value, { agents: [], total: 0, truncated: false, team: null })
  assert.deepEqual(jsonText(list, value), [{ type: 'text', text: JSON.stringify(value) }])
})

test('agent_manager_create maps parameters to the manager facade', async () => {
  const calls = []
  const tools = buildManagerTools({
    manager: {
      create: async (request) => {
        calls.push(request)
        return { childId: 'child-1', label: 'x', description: 'd', provider: 'spawn' }
      },
    },
    settings: { maxList: () => 50, memberProvider: () => 'fork' },
  })
  const create = tools.find((tool) => tool.name === 'agent_manager_create')
  const value = await create.execute({ label: 'x', description: 'd', prompt: 'p' }, exec)
  assert.equal(calls[0].sessionId, agent.id)
  assert.equal(calls[0].provider, 'fork')
  assert.equal(value.childId, 'child-1')
})

test('agent_manager_message and interrupt pass the session and target', async () => {
  const calls = []
  const tools = buildManagerTools({
    manager: {
      send: async (request) => {
        calls.push(['send', request])
        return { messageId: 'm1', target: 'child-1' }
      },
      interrupt: async (request) => {
        calls.push(['interrupt', request])
        return { accepted: true }
      },
    },
    settings: { maxList: () => 50, memberProvider: () => 'spawn' },
  })
  const message = tools.find((tool) => tool.name === 'agent_manager_message')
  const value = await message.execute({ agent_id: 'child-1', message: 'hi' }, exec)
  assert.equal(value.target, 'child-1')
  assert.deepEqual(calls[0][1], { sessionId: agent.id, target: 'child-1', message: 'hi' })

  const interrupt = tools.find((tool) => tool.name === 'agent_manager_interrupt')
  assert.deepEqual(await interrupt.execute({ agent_id: 'child-1' }, exec), { accepted: true })
})

test('buildTeamTools is empty without the Agent Teams service', () => {
  assert.deepEqual(buildTeamTools({ ctx: { get: () => undefined } }), [])
})

test('buildTeamTools guards membership and delegates', async () => {
  let membershipAgent = null
  const teamService = {
    tryMembership: (candidate) => {
      membershipAgent = candidate
      return { root: agent, id: agent.id, role: 'lead', name: 'lead' }
    },
    listTasks: () => [
      { id: 'task-1', revision: 1, subject: 's', description: 'd', status: 'pending', blockedBy: [], writeScopes: [], ready: true, writeScopeWarnings: [] },
      { id: 'task-2', revision: 1, subject: 't', description: 'd', status: 'completed', blockedBy: [], writeScopes: [], ready: false, writeScopeWarnings: [] },
    ],
    createTask: async (caller, request) => ({ id: 'task-3', revision: 1, ...request, status: 'pending', blockedBy: [], ready: true, writeScopeWarnings: [] }),
    updateTask: async (caller, request) => ({ id: request.taskId, revision: 2, subject: 's', description: 'd', status: 'completed', blockedBy: [], writeScopes: [], ready: false, writeScopeWarnings: [] }),
  }
  const tools = buildTeamTools({ ctx: { get: (name) => (name === 'agentTeams' ? teamService : undefined) } })
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ['agent_manager_task_create', 'agent_manager_task_list', 'agent_manager_task_update'],
  )

  const list = tools.find((tool) => tool.name === 'agent_manager_task_list')
  const value = await list.execute({ status: 'pending' }, exec)
  assert.equal(value.tasks.length, 1)
  assert.equal(value.tasks[0].id, 'task-1')

  const create = tools.find((tool) => tool.name === 'agent_manager_task_create')
  const created = await create.execute({ subject: 'n', description: 'd' }, exec)
  assert.equal(created.id, 'task-3')

  const update = tools.find((tool) => tool.name === 'agent_manager_task_update')
  const updated = await update.execute({ task_id: 'task-1', expected_revision: 1, action: 'complete' }, exec)
  assert.equal(updated.revision, 2)

  const noTeam = buildTeamTools({ ctx: { get: (name) => (name === 'agentTeams' ? {
    tryMembership: () => undefined,
  } : undefined) } })
  const guarded = noTeam[1]
  await assert.rejects(Promise.resolve().then(() => guarded.execute({}, exec)), /not part of an active Agent Team/)
})
