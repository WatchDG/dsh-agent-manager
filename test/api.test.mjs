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

function makeCtx(subagents, team) {
  return {
    get: (name) => (name === 'subagents' ? subagents : name === 'agentTeams' ? team : undefined),
    agents: { get: (id) => (id === PARENT.id ? PARENT : undefined), list: () => [PARENT] },
    logger: { warn: () => {} },
  }
}

function freshStore() {
  const dir = mkdtempSync(path.join(tmpdir(), 'dsh-am-test-'))
  return { dir, store: createAgentStore(() => dir), cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

function makeManager(store, subagents = fakeSubagents()) {
  return {
    manager: createAgentManager(makeCtx(subagents), () => ({ memberProvider: 'spawn', maxList: 50 }), store),
    subagents,
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
    assert.equal(subagents.activations.length, 1)
    const request = subagents.activations[0].request
    assert.equal(request.parent, PARENT)
    assert.match(request.prompt[0].text, /You review code\./)
    assert.match(request.prompt[0].text, /Review PR #5/)
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
