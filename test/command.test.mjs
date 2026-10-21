// The /agent-manager command parser and handler.
import test from 'node:test'
import assert from 'node:assert/strict'
import { executeCommand, parseCommand, renderStatus, USAGE } from '../lib/command.js'

const agent = { id: 'session-1' }

test('parseCommand handles empty, run, session flag, and usage', () => {
  assert.deepEqual(parseCommand(''), { kind: 'status' })
  assert.deepEqual(parseCommand('  '), { kind: 'status' })
  assert.deepEqual(parseCommand('run reviewer | Review the PR'), {
    kind: 'run',
    agent: 'reviewer',
    task: 'Review the PR',
  })
  assert.deepEqual(parseCommand('run --session session-42 writer | Draft'), {
    kind: 'run',
    agent: 'writer',
    task: 'Draft',
    session: 'session-42',
  })
  assert.deepEqual(parseCommand('run --model openai/gpt-5 reviewer | Review'), {
    kind: 'run',
    agent: 'reviewer',
    task: 'Review',
    modelProvider: 'openai',
    modelName: 'gpt-5',
  })
  assert.deepEqual(parseCommand('run --session=session-42 --model=openai/gpt-5 writer | Draft'), {
    kind: 'run',
    agent: 'writer',
    task: 'Draft',
    session: 'session-42',
    modelProvider: 'openai',
    modelName: 'gpt-5',
  })
  assert.equal(parseCommand('run reviewer').kind, 'usage')
  assert.equal(parseCommand('run |').kind, 'usage')
  assert.equal(parseCommand('create x | y').kind, 'usage')
  assert.equal(parseCommand('run --session').kind, 'usage')
  assert.equal(parseCommand('run --model openai writer | Draft').kind, 'usage')
  assert.equal(parseCommand('run --model= writer | Draft').kind, 'usage')
})

test('renderStatus lists definitions and spawned children', () => {
  const text = renderStatus({
    definitions: [{ name: 'reviewer', provider: 'spawn', description: 'Reviews PRs' }],
    agents: [{ id: 'c1', label: 'reviewer', mode: 'continuable', active: true }],
    total: 1,
    truncated: false,
    team: null,
  })
  assert.match(text, /Defined agents: 1/)
  assert.match(text, /reviewer \[spawn, model: inherit\] — Reviews PRs/)
  assert.match(text, /Spawned children: 1/)
  assert.match(text, /reviewer \[running, continuable\] c1/)

  const fixed = renderStatus({
    definitions: [
      {
        name: 'pinned',
        provider: 'spawn',
        description: 'Pinned',
        modelMode: 'fixed',
        modelProvider: 'openai',
        modelName: 'gpt-5',
      },
    ],
    agents: [{ id: 'c2', label: 'pinned', mode: 'continuable', active: false, model: 'openai/gpt-5' }],
    total: 1,
    truncated: false,
    team: null,
  })
  assert.match(fixed, /pinned \[spawn, model: openai\/gpt-5\]/)
  assert.match(fixed, /pinned \[inactive, continuable, openai\/gpt-5\] c2/)
})

test('executeCommand shows status for empty input', async () => {
  const manager = {
    overview: async () => ({ agents: [], total: 0, truncated: false, team: null }),
    listAgents: () => ({ agents: [] }),
  }
  const result = await executeCommand({ manager }, { agent, rawInput: '' })
  assert.equal(result.kind, 'success')
  assert.match(result.text, /Defined agents: 0/)
})

test('executeCommand spawns a defined agent through the manager', async () => {
  const calls = []
  const manager = {
    spawn: async (request) => {
      calls.push(request)
      return { childId: 'child-9', name: 'reviewer', provider: 'spawn' }
    },
  }
  const result = await executeCommand({ manager }, { agent, rawInput: 'run reviewer | Do it' })
  assert.equal(result.kind, 'success')
  assert.match(result.text, /child-9/)
  assert.equal(calls[0].sessionId, agent.id)
  assert.equal(calls[0].agentId, 'reviewer')
})

test('executeCommand returns usage for malformed input and errors for failures', async () => {
  const manager = {}
  const bad = await executeCommand({ manager }, { agent, rawInput: 'nope' })
  assert.equal(bad.kind, 'error')
  assert.match(bad.text, /Usage/)

  const failing = await executeCommand(
    { manager: { spawn: async () => { throw new Error('agent not defined') } } },
    { agent, rawInput: 'run x | Do it' },
  )
  assert.equal(failing.kind, 'error')
  assert.match(failing.text, /agent not defined/)
  assert.match(USAGE, /agent-manager/)
})
