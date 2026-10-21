// Manager facade: persistent definitions (list/save/delete), spawn, and
// child overview annotations/tombstones.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createAgentManager } from '../lib/api.js'
import { createAgentStore } from '../lib/store.js'

const PARENT = { id: 'parent-1' }

function fakeSubagents() {
  const children = [
    { id: 'child-1', mode: 'continuable', label: 'writer', createdAt: 1 },
    { id: 'child-2', mode: 'one-shot', label: 'reader', createdAt: 2 },
  ]
  const drained = []
  const sent = []
  const activations = []
  return {
    children,
    drained,
    sent,
    activations,
    listChildren: async () => children,
    sendMessage: async (sender, targetId, content) => {
      sent.push({ targetId, content })
      return { messageId: 'm1' }
    },
    drainChildren: async (parent, childIds) => {
      drained.push(childIds)
    },
    startActivation: async (spec) => {
      activations.push(spec)
      return { childId: 'child-x' }
    },
  }
}

function makeCtx(subagents, team, services = {}) {
  return {
    get: (name) =>
      name === 'subagents' ? subagents : name === 'agentTeams' ? team : services[name],
    agents: { get: (id) => (id === PARENT.id ? PARENT : undefined), list: () => [PARENT] },
    logger: { warn: () => {} },
  }
}

function freshStore() {
  const dir = mkdtempSync(path.join(tmpdir(), 'dsh-am-test-'))
  return { dir, store: createAgentStore(() => dir), cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

function makeManager(store, subagents = fakeSubagents(), options = {}) {
  const settings = {
    memberProvider: 'spawn',
    maxList: 50,
    allowedModels: [],
    ...options.settings,
  }
  return {
    manager: createAgentManager(
      makeCtx(subagents, options.team, options.services),
      () => settings,
      store,
    ),
    subagents,
    settings,
  }
}

test('definitions: save, list, update, delete', () => {
  const { store, cleanup } = freshStore()
  try {
    const { manager } = makeManager(store)
    const saved = manager.saveAgent({ name: 'Reviewer', description: 'Reviews PRs', prompt: 'You review code.', provider: 'spawn' })
    assert.equal(typeof saved.id, 'string')
    assert.ok(saved.id.length > 0)
    assert.equal(saved.name, 'Reviewer')
    assert.equal(saved.provider, 'spawn')

    const list = manager.listAgents().agents
    assert.equal(list.length, 1)
    assert.equal(list[0].name, 'Reviewer')

    const updated = manager.saveAgent({ id: saved.id, name: 'Senior Reviewer', description: 'Reviews PRs', prompt: 'You review deeply.', provider: 'fork' })
    assert.equal(updated.name, 'Senior Reviewer')
    assert.equal(updated.provider, 'fork')
    assert.equal(updated.createdAt, saved.createdAt)

    manager.deleteAgent(saved.id)
    assert.equal(manager.listAgents().agents.length, 0)
  } finally {
    cleanup()
  }
})

test('spawn combines base prompt with the task and uses the definition provider', async () => {
  const { store, cleanup } = freshStore()
  try {
    const subagents = fakeSubagents()
    const { manager } = makeManager(store, subagents)
    const def = manager.saveAgent({ name: 'Reviewer', description: 'Reviews PRs', prompt: 'You review code.', provider: 'fork' })

    const result = await manager.spawn({ sessionId: PARENT.id, agentId: def.id, task: 'Review PR #5' })
    assert.equal(result.childId, 'child-x')
    assert.equal(result.name, 'Reviewer')
    assert.equal(result.provider, 'fork')
    assert.equal(result.modelMode, 'inherit')
    assert.equal(result.modelSource, 'session')
    assert.equal(result.model, null)
    assert.equal(subagents.activations.length, 1)
    const request = subagents.activations[0].request
    assert.equal(request.parent, PARENT)
    assert.equal(request.agentOptions, undefined)
    assert.match(request.prompt[0].text, /You review code\./)
    assert.match(request.prompt[0].text, /Review PR #5/)
  } finally {
    cleanup()
  }
})

test('spawn passes a fixed agent model and ignores the coordinator route', async () => {
  const { store, cleanup } = freshStore()
  try {
    const subagents = fakeSubagents()
    const { manager } = makeManager(store, subagents, {
      settings: { allowedModels: [{ provider: 'allowed', model: 'm' }] },
    })
    const def = manager.saveAgent({
      name: 'Pinned',
      description: 'Pinned model',
      prompt: 'Do work.',
      provider: 'spawn',
      modelMode: 'fixed',
      modelProvider: 'fixed',
      modelName: 'only',
    })
    const result = await manager.spawn({
      sessionId: PARENT.id,
      agentId: def.id,
      task: 'Go',
      modelProvider: 'allowed',
      modelName: 'm',
    })
    assert.deepEqual(subagents.activations[0].request.agentOptions, { provider: 'fixed', model: 'only' })
    assert.equal(result.modelMode, 'fixed')
    assert.equal(result.model, 'fixed/only')
    assert.equal(result.modelSource, 'agent')
  } finally {
    cleanup()
  }
})

test('auto agents use an allowed coordinator route or fall back to the session', async () => {
  const { store, cleanup } = freshStore()
  try {
    const subagents = fakeSubagents()
    const { manager } = makeManager(store, subagents, {
      settings: { allowedModels: [{ provider: 'p', model: 'm' }] },
    })
    const def = manager.saveAgent({
      name: 'Flexible',
      description: 'Coordinator picks',
      prompt: 'Do work.',
      provider: 'spawn',
      modelMode: 'auto',
    })

    const chosen = await manager.spawn({
      sessionId: PARENT.id,
      agentId: def.id,
      task: 'One',
      modelProvider: 'p',
      modelName: 'm',
    })
    assert.deepEqual(subagents.activations[0].request.agentOptions, { provider: 'p', model: 'm' })
    assert.equal(chosen.modelSource, 'coordinator')
    assert.equal(chosen.model, 'p/m')

    const inherited = await manager.spawn({ sessionId: PARENT.id, agentId: def.id, task: 'Two' })
    assert.equal(subagents.activations[1].request.agentOptions, undefined)
    assert.equal(inherited.modelSource, 'session')
    assert.equal(inherited.model, null)

    await assert.rejects(
      manager.spawn({
        sessionId: PARENT.id,
        agentId: def.id,
        task: 'Three',
        modelProvider: 'p',
        modelName: 'other',
      }),
      /not available to the coordinator/,
    )
  } finally {
    cleanup()
  }
})

test('distribution models fall back to the Host subagent selection policy', async () => {
  const { store, cleanup } = freshStore()
  try {
    const subagents = fakeSubagents()
    const { manager } = makeManager(store, subagents, {
      services: {
        subagentModelSelection: {
          current: () => ({
            enabled: true,
            allowedModels: [{ provider: 'host', model: 'h' }],
          }),
        },
      },
    })
    const def = manager.saveAgent({
      name: 'Host policy',
      description: 'Uses the Host policy',
      prompt: 'Do work.',
      provider: 'spawn',
      modelMode: 'auto',
    })
    const result = await manager.spawn({
      sessionId: PARENT.id,
      agentId: def.id,
      task: 'Go',
      modelProvider: 'host',
      modelName: 'h',
    })
    assert.deepEqual(subagents.activations[0].request.agentOptions, { provider: 'host', model: 'h' })
    assert.equal(result.modelSource, 'coordinator')
  } finally {
    cleanup()
  }
})

test('listModels exposes allowed routes and the advertised catalog', async () => {
  const { store, cleanup } = freshStore()
  try {
    const { manager } = makeManager(store, fakeSubagents(), {
      settings: { allowedModels: [{ provider: 'p', model: 'm' }, { provider: 'gone', model: 'old' }] },
      services: {
        llm: {
          listProviders: () => [{ id: 'p', name: 'Provider P' }],
          listModels: async () => [{ id: 'm', name: 'Model M' }, { id: 'extra', name: 'Extra' }],
        },
      },
    })
    const allowed = await manager.listModels({ scope: 'allowed' })
    assert.equal(allowed.source, 'config')
    assert.equal(allowed.available, true)
    assert.deepEqual(
      allowed.allowedModels.map((row) => `${row.provider}/${row.model}:${row.available}`),
      ['p/m:true', 'gone/old:false'],
    )
    assert.deepEqual(
      allowed.providers.map((row) => `${row.provider}:${row.available}`),
      ['gone:false', 'p:true'],
    )
    assert.equal(allowed.models.length, 2)
    assert.equal(allowed.models[0].name, 'Model M')

    const all = await manager.listModels({ scope: 'all' })
    assert.ok(all.models.some((row) => row.model === 'extra'))
    assert.ok(all.models.some((row) => row.model === 'old' && row.available === false))
    assert.ok(all.providers.some((row) => row.provider === 'p' && row.name === 'Provider P'))
  } finally {
    cleanup()
  }
})

test('saveAgent validates fixed model routes', () => {
  const { store, cleanup } = freshStore()
  try {
    const { manager } = makeManager(store)
    assert.throws(
      () =>
        manager.saveAgent({
          name: 'Broken',
          description: 'No route',
          prompt: 'Do work.',
          provider: 'spawn',
          modelMode: 'fixed',
        }),
      /fixed model mode requires both/,
    )
  } finally {
    cleanup()
  }
})

test('spawn rejects an unknown agent definition', async () => {
  const { store, cleanup } = freshStore()
  try {
    const { manager } = makeManager(store)
    await assert.rejects(manager.spawn({ sessionId: PARENT.id, agentId: 'nope', task: 'x' }), /not defined/)
  } finally {
    cleanup()
  }
})

test('overview applies annotations and hides tombstones', async () => {
  const { store, cleanup } = freshStore()
  try {
    const subagents = fakeSubagents()
    const { manager } = makeManager(store, subagents)
    store.annotate('child-1', { label: 'Renamed', description: 'Now reviews' })
    store.remove('child-2')

    const view = await manager.overview(PARENT.id)
    assert.equal(view.total, 2)
    assert.equal(view.agents.length, 1)
    assert.equal(view.agents[0].id, 'child-1')
    assert.equal(view.agents[0].label, 'Renamed')
    assert.equal(view.agents[0].description, 'Now reviews')
    assert.equal(view.team, null)
  } finally {
    cleanup()
  }
})

test('update annotates and steers instructions as a message', async () => {
  const { store, cleanup } = freshStore()
  try {
    const subagents = fakeSubagents()
    const { manager } = makeManager(store, subagents)
    const result = await manager.update({
      sessionId: PARENT.id,
      target: 'child-1',
      label: 'Senior writer',
      description: 'Writes the final draft',
      instructions: 'Now focus on chapter 4.',
    })
    assert.equal(result.updated, true)
    assert.equal(result.id, 'child-1')
    assert.equal(result.messageId, 'm1')
    assert.equal(subagents.sent.length, 1)
    assert.equal(subagents.sent[0].targetId, 'child-1')

    const view = await manager.overview(PARENT.id)
    const row = view.agents.find((agent) => agent.id === 'child-1')
    assert.equal(row.label, 'Senior writer')
    assert.equal(row.description, 'Writes the final draft')
  } finally {
    cleanup()
  }
})

test('remove drains the child and tombstones it', async () => {
  const { store, cleanup } = freshStore()
  try {
    const subagents = fakeSubagents()
    const { manager } = makeManager(store, subagents)
    const result = await manager.remove({ sessionId: PARENT.id, target: 'child-1' })
    assert.equal(result.removed, true)
    assert.deepEqual(subagents.drained, [['child-1']])

    const view = await manager.overview(PARENT.id)
    assert.equal(view.agents.length, 1)
    assert.equal(view.agents[0].id, 'child-2')
  } finally {
    cleanup()
  }
})
