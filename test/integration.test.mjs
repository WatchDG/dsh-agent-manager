// Live integration smoke against a running Harness profile.
// Skipped unless DSH_AGENT_MANAGER_INTEGRATION is set to a truthy value.
import test from 'node:test'
import assert from 'node:assert/strict'

const enabled = process.env.DSH_AGENT_MANAGER_INTEGRATION

test('integration is opt-in', { skip: !enabled }, async () => {
  const module = await import('../index.js')
  assert.equal(typeof module.apply, 'function')
  // A real run would mount against a live Context and exercise the manager
  // facade with a resident session. This gate keeps CI deterministic.
})
