// Wiring smoke test: the plugin registers its contributions on a fake context.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mount, ROUTES, USAGE } from '../lib/plugin.js'

function fakeContext() {
  const effects = []
  const sections = []
  const tools = []
  const commands = []
  const injectCalls = []
  return {
    effects,
    sections,
    tools,
    commands,
    injectCalls,
    ctx: {
      effect: (fn) => {
        effects.push(fn)
        return fn() ?? (() => undefined)
      },
      get: () => undefined,
      systemPrompt: {
        section: (section) => sections.push(section),
        getSectionOrder: () => 1000,
      },
      tools: { register: (definition) => tools.push(definition) },
      commands: { register: (definition) => commands.push(definition) },
      inject: (deps, callback) => injectCalls.push({ deps, callback }),
    },
  }
}

test('mount registers the protocol section, tools, and command', () => {
  const { ctx, sections, tools, commands, effects } = fakeContext()
  mount(ctx, {})
  assert.equal(effects.length, 7) // section + 5 tools + command
  assert.equal(sections.length, 1)
  assert.equal(sections[0].name, 'agent-manager:rules')
  assert.equal(sections[0].order, 1010)
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'agent_manager_list',
      'agent_manager_spawn',
      'agent_manager_list_models',
      'agent_manager_message',
      'agent_manager_interrupt',
    ],
  )
  assert.equal(commands.length, 1)
  assert.equal(commands[0].name, 'agent-manager')
  assert.equal(typeof commands[0].handler, 'function')
})

test('mount skips tools and section when disabled', () => {
  const { ctx, sections, tools, commands, effects } = fakeContext()
  mount(ctx, { toolsEnabled: false })
  assert.equal(sections.length, 0)
  assert.equal(tools.length, 0)
  assert.equal(commands.length, 1)
  assert.equal(effects.length, 1)
})

test('mount requests settings and web-server injection', () => {
  const { ctx, injectCalls } = fakeContext()
  mount(ctx, {})
  const depNames = injectCalls.map((entry) => entry.deps.join(','))
  assert.ok(depNames.includes('settings'))
  assert.ok(depNames.includes('webServer,connection'))
})

test('route paths are stable and exported', () => {
  assert.deepEqual(ROUTES, {
    overview: '/agents/overview',
    sessions: '/agents/sessions',
    list: '/agents/list',
    models: '/agents/models',
    save: '/agents/save',
    deleteAgent: '/agents/delete-agent',
    spawn: '/agents/spawn',
    update: '/agents/update',
    remove: '/agents/remove',
    message: '/agents/message',
    interrupt: '/agents/interrupt',
  })
})
