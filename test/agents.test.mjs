// Pure catalog mapping and validation helpers.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  catalogView,
  formatModelRoute,
  modelRouteFromString,
  modelRouteKey,
  normalizeLimit,
  normalizeModelMode,
  normalizeModelRoute,
  normalizeModelRoutes,
  normalizeProvider,
  parentModelRoute,
  requiredPrompt,
  requiredText,
  resolveAgentModel,
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

test('model mode and route normalization tolerates legacy and invalid values', () => {
  assert.equal(normalizeModelMode(undefined), 'inherit')
  assert.equal(normalizeModelMode('auto'), 'auto')
  assert.equal(normalizeModelMode('fixed'), 'fixed')
  assert.equal(normalizeModelMode('weird'), 'inherit')

  assert.deepEqual(normalizeModelRoute(' deepseek ', ' flash '), { provider: 'deepseek', model: 'flash' })
  assert.equal(normalizeModelRoute('deepseek', ''), null)
  assert.equal(normalizeModelRoute(null, 'flash'), null)

  assert.deepEqual(
    normalizeModelRoutes([
      { provider: 'a', model: 'm' },
      { provider: ' a ', model: ' m ' },
      { provider: '', model: 'x' },
      null,
      { provider: 'b', model: 'n' },
    ]),
    [
      { provider: 'a', model: 'm' },
      { provider: 'b', model: 'n' },
    ],
  )
  assert.deepEqual(normalizeModelRoutes('nope'), [])
})

test('model route strings parse and render', () => {
  assert.deepEqual(modelRouteFromString('openai/gpt-5'), { provider: 'openai', model: 'gpt-5' })
  assert.equal(modelRouteFromString('openai'), null)
  assert.equal(modelRouteFromString('/gpt-5'), null)
  assert.equal(modelRouteFromString('openai/'), null)
  assert.equal(formatModelRoute({ provider: 'openai', model: 'gpt-5' }), 'openai/gpt-5')
  assert.equal(formatModelRoute(null), null)
  assert.equal(modelRouteKey({ provider: 'a', model: 'b' }), modelRouteKey({ provider: 'a', model: 'b' }))
})

test('parentModelRoute prefers the latest request route', () => {
  const parent = {
    options: { provider: 'created', model: 'created-model' },
    session: { requestHeader: () => ({ config: { provider: 'request', model: 'request-model' } }) },
  }
  assert.deepEqual(parentModelRoute(parent), { provider: 'request', model: 'request-model' })
  assert.deepEqual(
    parentModelRoute({ options: { provider: 'created', model: 'created-model' } }),
    { provider: 'created', model: 'created-model' },
  )
  assert.equal(parentModelRoute({ session: { requestHeader: () => ({}) } }), null)
  assert.equal(parentModelRoute(undefined), null)
  assert.equal(
    parentModelRoute({
      session: {
        requestHeader: () => {
          throw new Error('closed')
        },
      },
      options: { provider: 'p', model: 'm' },
    }).provider,
    'p',
  )
})

test('resolveAgentModel applies fixed, auto, and session precedence', () => {
  const allowed = [
    { provider: 'a', model: 'm1' },
    { provider: 'a', model: 'm2' },
  ]
  assert.deepEqual(
    resolveAgentModel({
      modelMode: 'fixed',
      modelProvider: 'fixed',
      modelName: 'only',
      requestedProvider: 'a',
      requestedModel: 'm1',
      allowedModels: allowed,
    }),
    { route: { provider: 'fixed', model: 'only' }, source: 'agent' },
  )
  assert.deepEqual(
    resolveAgentModel({
      modelMode: 'auto',
      requestedProvider: 'a',
      requestedModel: 'm2',
      allowedModels: allowed,
    }),
    { route: { provider: 'a', model: 'm2' }, source: 'coordinator' },
  )
  assert.deepEqual(
    resolveAgentModel({ modelMode: 'auto', allowedModels: allowed }),
    { route: null, source: 'session' },
  )
  assert.deepEqual(
    resolveAgentModel({ modelMode: 'inherit', requestedProvider: 'a', requestedModel: 'm1', allowedModels: allowed }),
    { route: null, source: 'session' },
  )
  // A fixed definition ignores a requested coordinator route.
  assert.equal(
    resolveAgentModel({
      modelMode: 'fixed',
      modelProvider: 'fixed',
      modelName: 'only',
      requestedProvider: 'a',
      requestedModel: 'm1',
    }).source,
    'agent',
  )
})

test('resolveAgentModel rejects missing or unauthorized choices', () => {
  assert.throws(
    () => resolveAgentModel({ modelMode: 'fixed' }),
    /fixed model but has no provider\/model/,
  )
  assert.throws(
    () =>
      resolveAgentModel({
        modelMode: 'auto',
        requestedProvider: 'a',
        requestedModel: 'nope',
        allowedModels: [{ provider: 'a', model: 'm1' }],
      }),
    /not available to the coordinator/,
  )
  assert.throws(
    () =>
      resolveAgentModel({
        modelMode: 'auto',
        requestedProvider: 'a',
        requestedModel: 'm1',
        allowedModels: [],
      }),
    /no distribution models are configured/,
  )
  assert.throws(
    () => resolveAgentModel({ modelMode: 'auto', requestedProvider: 'a', allowedModels: [] }),
    /supplied together/,
  )
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
