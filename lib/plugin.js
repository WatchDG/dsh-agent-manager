/**
 * dsh-agent-manager — plugin mounting.
 *
 * Kept separate from `index.js` so the wiring can be unit-tested with fake
 * services, without a running Harness.
 *
 * Config is read live: `snapshot()` unwraps volatile references on every use,
 * so the Settings page can flip `headerAction`, `autoRefreshMs`, and friends
 * without remounting the plugin.
 */

import { PROTOCOL_SECTION, snapshot } from './config.js'
import { createAgentManager } from './api.js'
import { buildManagerTools, buildTeamTools } from './tools.js'
import { executeCommand, USAGE } from './command.js'

/** Base order for the protocol section when the repository name is unknown. */
const FALLBACK_SECTION_ORDER = 1500

/** HTTP routes owned by the Web panel. */
export const ROUTES = {
  overview: '/agents/overview',
  create: '/agents/create',
  message: '/agents/message',
  interrupt: '/agents/interrupt',
}

/** Prompt section text shown to models when the tools are enabled. */
function protocolText() {
  return [
    '## Agent Manager',
    '',
    'Sub-agents you create with `agent_manager_create` become managed agents of this session. Use `agent_manager_list` to see them, `agent_manager_message` to wake one with a follow-up task, and `agent_manager_interrupt` to stop a running turn. Children inherit a fresh context (spawn) or this session’s completed turns (fork).',
    '',
    'When the Agent Teams runtime is mounted, the same tools also report the team roster and shared task board; teammate names are valid message and interrupt targets from the Team Lead.',
    '',
    'The Web UI shows the same panel under the “Agents” action in the conversation header; `/agent-manager` exposes a text equivalent.',
  ].join('\n')
}

/** Shared gate for the HTTP routes: browser-trust rejection, then method. */
function gate(child, req, res, methods) {
  const rejection = child.connection.requestRejection(req)
  if (rejection !== undefined) {
    res.statusCode = rejection
    res.end()
    return true
  }
  if (!methods.includes(req.method)) {
    res.statusCode = 405
    res.setHeader('allow', methods.join(', '))
    res.end()
    return true
  }
  return false
}

/** Send a JSON payload with no-store caching. */
function json(res, code, body) {
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

/** Read a bounded JSON request body. */
function readJsonBody(req, maxBytes = 65_536) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/** Wrap one async handler so a failure is a JSON error payload. */
function handle(handler) {
  return async (req, res) => {
    try {
      const data = await handler(req)
      json(res, 200, { ok: true, data })
    } catch (error) {
      json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }
}

/**
 * Register the protocol section, tools, command, HTTP routes, and settings page.
 *
 * @param {object} ctx Plugin context supplied by the DSH loader.
 * @param {unknown} rawConfig Bundle row config, possibly with volatile references.
 */
export function mount(ctx, rawConfig) {
  const getSettings = () => snapshot(rawConfig)
  const settings = getSettings()
  const manager = createAgentManager(ctx, getSettings)
  const settingsForTools = {
    maxList: () => getSettings().maxList,
    memberProvider: () => getSettings().memberProvider,
  }

  if (settings.toolsEnabled) {
    let order = FALLBACK_SECTION_ORDER
    try {
      order = ctx.systemPrompt.getSectionOrder('TOOL_SUBAGENT') + 10
    } catch {
      // Older or minimal profiles without the repository table.
    }
    ctx.effect(
      () =>
        ctx.systemPrompt.section({
          name: PROTOCOL_SECTION,
          order,
          text: protocolText(),
        }),
      'agent-manager: protocol section',
    )

    const definitions = [...buildManagerTools({ manager, settings: settingsForTools }), ...buildTeamTools({ ctx })]
    for (const definition of definitions) {
      ctx.effect(() => ctx.tools.register(definition), `agent-manager: tool ${definition.name}`)
    }
  }

  ctx.effect(
    () =>
      ctx.commands.register({
        name: 'agent-manager',
        description: 'Create and manage sub-agents for this session',
        input: { hint: '[create [--provider=spawn|fork] <description> | <prompt>]' },
        handler: (invocation) => executeCommand({ manager, getSettings }, invocation),
      }),
    'agent-manager: command',
  )

  if (typeof ctx.inject === 'function') {
    ctx.inject(['settings'], (child) => {
      if (ctx.fiber === undefined) return
      child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), 'agent-manager: own settings page')
    })

    ctx.inject(['webServer', 'connection'], (child) => {
      const registerRoute = (path, methods, handler) => {
        child.effect(
          () =>
            child.webServer.register({
              kind: 'exact',
              path,
              handler: async (req, res) => {
                if (gate(child, req, res, methods)) return
                await handler(req, res)
              },
            }),
          `agent-manager: ${methods.join('/')} ${path}`,
        )
      }

      registerRoute(ROUTES.overview, ['GET'], (req, res) =>
        handle(async (request) => {
          const url = new URL(request.url, 'http://localhost')
          const session = url.searchParams.get('session')
          if (!session) throw new Error('missing session query parameter')
          return manager.overview(session)
        })(req, res),
      )

      const bodyRoute = (path, operation) =>
        registerRoute(path, ['POST'], (req, res) =>
          handle(async (request) => {
            const body = await readJsonBody(request)
            if (!body.session) throw new Error('missing session in request body')
            return operation(body)
          })(req, res),
        )

      bodyRoute(ROUTES.create, (body) =>
        manager.create({
          sessionId: body.session,
          label: body.label,
          description: body.description,
          prompt: body.prompt,
          provider: body.provider,
        }),
      )
      bodyRoute(ROUTES.message, (body) =>
        manager.send({ sessionId: body.session, target: body.target, message: body.message }),
      )
      bodyRoute(ROUTES.interrupt, (body) =>
        manager.interrupt({ sessionId: body.session, target: body.target }),
      )
    })
  }
}

export { USAGE }
