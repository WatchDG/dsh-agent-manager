// Configuration normalization and volatile snapshot.
import test from 'node:test'
import assert from 'node:assert/strict'
import { Config, normalizeConfig, snapshot } from '../lib/config.js'

function ref(value) {
  return { get: () => value }
}

test('defaults are applied to an empty config', () => {
  const config = normalizeConfig({})
  assert.equal(config.memberProvider, 'spawn')
  assert.deepEqual(config.allowedModels, [])
  assert.equal(config.maxList, 50)
  assert.equal(config.headerAction, true)
  assert.equal(config.autoRefreshMs, 5000)
  assert.equal(config.toolsEnabled, true)
})

test('invalid values fall back to defaults', () => {
  const config = normalizeConfig({
    memberProvider: 'weird',
    allowedModels: [{ provider: '', model: 'x' }, { provider: 'a', model: '' }],
    maxList: -3,
    headerAction: 'yes',
    autoRefreshMs: 2,
    toolsEnabled: 0,
  })
  assert.equal(config.memberProvider, 'spawn')
  assert.deepEqual(config.allowedModels, [])
  assert.equal(config.maxList, 50)
  assert.equal(config.headerAction, true)
  assert.equal(config.autoRefreshMs, 1000) // below the floor, clamped
  assert.equal(config.toolsEnabled, true)
})

test('valid values are clamped and normalized', () => {
  const config = normalizeConfig({
    memberProvider: 'fork',
    allowedModels: [
      { provider: 'openai', model: 'gpt-5' },
      { provider: ' openai ', model: ' gpt-5 ' },
      { provider: 'deepseek', model: 'flash' },
    ],
    maxList: 500,
    headerAction: false,
    autoRefreshMs: 99999,
    toolsEnabled: false,
  })
  assert.equal(config.memberProvider, 'fork')
  assert.deepEqual(config.allowedModels, [
    { provider: 'openai', model: 'gpt-5' },
    { provider: 'deepseek', model: 'flash' },
  ])
  assert.equal(config.maxList, 200)
  assert.equal(config.headerAction, false)
  assert.equal(config.autoRefreshMs, 60000)
  assert.equal(config.toolsEnabled, false)
})

test('snapshot unwraps volatile references', () => {
  const config = snapshot({
    memberProvider: ref('fork'),
    allowedModels: ref([{ provider: 'host', model: 'm' }]),
    maxList: ref(12),
    headerAction: ref(false),
    autoRefreshMs: ref(2000),
    toolsEnabled: ref(false),
  })
  assert.equal(config.memberProvider, 'fork')
  assert.deepEqual(config.allowedModels, [{ provider: 'host', model: 'm' }])
  assert.equal(config.maxList, 12)
  assert.equal(config.headerAction, false)
  assert.equal(config.autoRefreshMs, 2000)
  assert.equal(config.toolsEnabled, false)
})

test('snapshot tolerates plain values and missing fields', () => {
  const config = snapshot({ memberProvider: 'fork', maxList: 7 })
  assert.equal(config.memberProvider, 'fork')
  assert.equal(config.maxList, 7)
  assert.equal(config.headerAction, true)
  assert.equal(config.autoRefreshMs, 5000)
  assert.equal(config.toolsEnabled, true)
})

test('Config schema shape stays compatible with the settings service', () => {
  assert.equal(typeof Config, 'function', 'Config is a schema factory')
  assert.equal(Config.type, 'object')
})
