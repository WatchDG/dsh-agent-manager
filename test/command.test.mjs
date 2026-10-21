// The /agent-manager command parser and handler.
import test from 'node:test'
import assert from 'node:assert/strict'
import { executeCommand, parseCommand, renderStatus, USAGE } from '../lib/command.js'

const agent = { id: 'session-1' }

test('parseCommand handles empty, create, provider flag, and usage', () => {
  assert.deepEqual(parseCommand(''), { kind: 'status' })
  assert.deepEqual(parseCommand('  '), { kind: 'status' })
  assert.deepEqual(parseCommand('create One | Do it'), {
    kind: 'create',
    description: 'One',
    prompt: 'Do it',
  })
  assert.deepEqual(parseCommand('create --provider=fork One | Do it'), {
    kind: 'create',
    description: 'One',
    prompt: 'Do it',
    provider: 'fork',
  })
  assert.equal(parseCommand('create One').kind, 'usage')
  assert.equal(parseCommand('create |').kind, 'usage')
  assert.equal(parseCommand('anything else').kind, 'usage')
  assert.equal(parseCommand('create --provider=weird One | Do it').kind, 'usage')
})

test('renderStatus lists agents with team fallback note', () => {
  const text = renderStatus({
    agents: [
      { id: 'c1', label: 'writer', mode: 'continuable', active: true },
      { id: 'c2', label: null, mode: 'one-shot', active: false },
    ],
    total: 2,
    truncated: false,
    team: null,
  })
  assert.match(text, /writer \[running, continuable\] c1/)
  assert.match(text, /c2 \[inactive, one-shot\]/)
  assert.match(text, /Agent Teams runtime is not mounted/)

  const teamText = renderStatus({ agents: [], total: 0, truncated: false, team: { members: [], tasks: [] } })
  assert.match(teamText, /Agent Teams: 0 member\(s\)/)
})

test('executeCommand shows status for empty input', async () => {
  const manager = {
    overview: async () => ({ agents: [], total: 0, truncated: false, team: null }),
  }
  const result = await executeCommand({ manager, getSettings: () => ({ memberProvider: 'spawn' }) }, { agent, rawInput: '' })
  assert.equal(result.kind, 'success')
  assert.match(result.text, /Managed agents: 0/)
})

test('executeCommand creates an agent through the manager', async () => {
  const calls = []
  const manager = {
    create: async (request) => {
      calls.push(request)
      return { childId: 'child-9', provider: 'spawn', description: 'One', label: 'One' }
    },
  }
  const result = await executeCommand(
    { manager, getSettings: () => ({ memberProvider: 'spawn' }) },
    { agent, rawInput: 'create One | Do something' },
  )
  assert.equal(result.kind, 'success')
  assert.match(result.text, /child-9/)
  assert.equal(calls[0].sessionId, agent.id)
  assert.equal(calls[0].provider, 'spawn')
})

test('executeCommand returns usage for malformed input and errors for failures', async () => {
  const manager = {}
  const bad = await executeCommand({ manager, getSettings: () => ({ memberProvider: 'spawn' }) }, { agent, rawInput: 'nope' })
  assert.equal(bad.kind, 'error')
  assert.match(bad.text, /Usage/)

  const failing = await executeCommand(
    { manager: { create: async () => { throw new Error('session is not live') } }, getSettings: () => ({ memberProvider: 'fork' }) },
    { agent, rawInput: 'create One | Do it' },
  )
  assert.equal(failing.kind, 'error')
  assert.match(failing.text, /session is not live/)
  assert.match(USAGE, /agent-manager/)
})
