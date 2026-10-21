// Pure catalog mapping and validation helpers.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  catalogView,
  normalizeLimit,
  normalizeProvider,
  requiredPrompt,
  requiredText,
  teamMembersView,
  teamTasksView,
  toChildView,
} from '../lib/agents.js'

test('toChildView maps catalog entries including unknown modes', () => {
  const live = new Map([['a', {}]])
  assert.deepEqual(toChildView({ id: 'a', mode: 'continuable', label: 'writer', createdAt: 7 }, live), {
    id: 'a',
    label: 'writer',
    mode: 'continuable',
    createdAt: 7,
    live: true,
    active: true,
  })
  assert.equal(toChildView({ id: 'b', mode: 'weird', createdAt: 0 }, live).mode, 'unknown')
  assert.equal(toChildView({ id: 'c', mode: 'external', createdAt: 0 }, live).active, false)
})

test('catalogView limits, counts, and reports truncation', () => {
  const entries = Array.from({ length: 5 }, (_, index) => ({ id: `s${index}`, mode: 'continuable', createdAt: index }))
  const view = catalogView(entries, new Map(), 3)
  assert.equal(view.agents.length, 3)
  assert.equal(view.total, 5)
  assert.equal(view.truncated, true)
  const full = catalogView(entries, new Map(), 10)
  assert.equal(full.truncated, false)
})

test('requiredText trims and bounds', () => {
  assert.equal(requiredText('  hello  ', 'x', 10), 'hello')
  assert.throws(() => requiredText('', 'x', 10), /must be non-empty/)
  assert.throws(() => requiredText('a'.repeat(11), 'x', 10), /exceeds 10 characters/)
})

test('requiredPrompt validates a non-empty prompt', () => {
  assert.equal(requiredPrompt('  do it  '), 'do it')
  assert.throws(() => requiredPrompt(' '), /prompt must be non-empty/)
})

test('normalizeProvider honors explicit and configured choices', () => {
  assert.equal(normalizeProvider(undefined, 'spawn'), 'spawn')
  assert.equal(normalizeProvider('fork', 'spawn'), 'fork')
  assert.equal(normalizeProvider('spawn', 'fork'), 'fork')
  assert.equal(normalizeProvider(undefined, 'fork'), 'fork')
})

test('normalizeLimit bounds the rows', () => {
  assert.equal(normalizeLimit(undefined, 50), 50)
  assert.equal(normalizeLimit(3, 50), 3)
  assert.equal(normalizeLimit(999, 50), 200)
  assert.equal(normalizeLimit('x', 50), 50)
})

test('team views compact member and task rows', () => {
  const members = teamMembersView([
    { name: 'lead', role: 'lead', status: 'running', diagnostics: [] },
    { name: 'coder', role: 'teammate', status: 'inactive', description: 'writes', model: 'm', diagnostics: [] },
  ])
  assert.equal(members[0].name, 'lead')
  assert.equal(members[1].description, 'writes')
  assert.deepEqual(teamMembersView(undefined), undefined)

  const tasks = teamTasksView([
    { id: 'task-1', revision: 1, subject: 's', description: 'd', status: 'pending', blockedBy: [], writeScopes: [], ready: true, writeScopeWarnings: [] },
  ])
  assert.equal(tasks[0].id, 'task-1')
  assert.equal(tasks[0].ready, true)
  assert.deepEqual(teamTasksView(undefined), undefined)
})
