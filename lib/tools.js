/**
 * dsh-agent-manager — model-facing tool definitions.
 *
 * Definitions are plain objects in the shape `ctx.tools.register` accepts:
 * `name`, `description`, `parameters` (raw JSON Schema — the registry forwards
 * it to the provider verbatim), `output` (`schema` + `render`), and
 * `execute(args, exec)`. `defineTool` compiles author-facing property
 * descriptors into that schema, but a bundle plugin cannot import it, so
 * `parametersSchema` performs the same conversion locally. No Harness package
 * is imported, so the bundle stays dependency-free beyond
 * `@deepseek-ai/schemastery`.
 *
 * Every mutation funnels through the manager facade, so the UI and the tools
 * behave identically.
 */

/** Compact JSON text output shared by every tool. */
function jsonOutput(schema) {
  return {
    schema,
    render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
  }
}

/** Object schema with a top-level required list (standard JSON Schema). */
function objectSchema(properties, required) {
  return {
    type: 'object',
    properties,
    ...(required === undefined ? {} : { required }),
  }
}

/**
 * Compile one author-facing value descriptor into a raw JSON Schema node.
 *
 * Mirrors the subset of the `defineTool` schema DSL these tools use: scalar
 * types, `enum`, `array` with `items`, and `object` with `properties`. The
 * author-only `required: true` marker is dropped here and lifted to the
 * enclosing object by `parameterObject`.
 *
 * @param {object} descriptor Author-facing descriptor.
 * @param {string} path Location for error messages.
 * @returns {object} Raw JSON Schema node.
 */
function parameterNode(descriptor, path) {
  if (descriptor === null || typeof descriptor !== 'object') {
    throw new TypeError(`${path} must be a schema object`)
  }
  const node = {}
  if (descriptor.description !== undefined) node.description = descriptor.description
  switch (descriptor.type) {
    case 'string':
    case 'number':
    case 'integer':
    case 'boolean':
    case 'null':
      node.type = descriptor.type
      if (descriptor.enum !== undefined) node.enum = [...descriptor.enum]
      break
    case 'array':
      node.type = 'array'
      if (descriptor.items !== undefined) node.items = parameterNode(descriptor.items, `${path}.items`)
      break
    case 'object': {
      node.type = 'object'
      const compiled = parameterObject(descriptor.properties ?? {}, `${path}.properties`)
      node.properties = compiled.properties
      if (compiled.required.length > 0) node.required = compiled.required
      break
    }
    default:
      throw new TypeError(`${path}.type must be string/number/integer/boolean/null/array/object`)
  }
  return node
}

/**
 * Split one property map into compiled schemas plus its top-level names.
 *
 * @param {Record<string, object>} properties Author-facing descriptors.
 * @param {string} path Location for error messages.
 * @returns {{ properties: Record<string, object>, required: string[] }}
 */
function parameterObject(properties, path) {
  const compiled = {}
  const required = []
  for (const [name, descriptor] of Object.entries(properties)) {
    if (descriptor?.required === true) required.push(name)
    compiled[name] = parameterNode(descriptor, `${path}.${name}`)
  }
  return { properties: compiled, required }
}

/**
 * Build the raw JSON Schema of a tool's parameter object.
 *
 * The registry passes this value straight to the model provider, so it must
 * carry the `type: 'object'` root itself; an unconverted descriptor map is
 * rejected as `type: null`.
 *
 * @param {Record<string, object>} parameters Author-facing descriptors.
 * @returns {{ type: 'object', properties: Record<string, object>, required?: string[] }}
 */
function parametersSchema(parameters) {
  const { properties, required } = parameterObject(parameters, 'parameters')
  return {
    type: 'object',
    properties,
    ...(required.length === 0 ? {} : { required }),
  }
}

/** Schema of one child-agent row. */
const CHILD_VIEW_SCHEMA = objectSchema(
  {
    id: { type: 'string' },
    label: { type: 'string' },
    mode: { type: 'string', enum: ['one-shot', 'external', 'continuable', 'unknown'] },
    createdAt: { type: 'integer' },
    live: { type: 'boolean' },
    active: { type: 'boolean' },
    model: { type: 'string' },
    modelSource: { type: 'string', enum: ['agent', 'coordinator', 'session'] },
  },
  ['id', 'mode', 'createdAt', 'live', 'active'],
)

const CHILD_LIST_VALUE_SCHEMA = objectSchema(
  {
    agents: { type: 'array', items: CHILD_VIEW_SCHEMA },
    total: { type: 'integer' },
    truncated: { type: 'boolean' },
    team: { type: 'object' },
  },
  ['agents', 'total', 'truncated'],
)

const SPAWN_VALUE_SCHEMA = objectSchema(
  {
    childId: { type: 'string' },
    agentId: { type: 'string' },
    name: { type: 'string' },
    task: { type: 'string' },
    provider: { type: 'string' },
    modelMode: { type: 'string', enum: ['inherit', 'auto', 'fixed'] },
    model: { type: 'string' },
    modelSource: { type: 'string', enum: ['agent', 'coordinator', 'session'] },
  },
  ['childId', 'agentId', 'name', 'task', 'provider'],
)

/** Schema of one exact LLM route row. */
const MODEL_VIEW_SCHEMA = objectSchema(
  {
    provider: { type: 'string' },
    model: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    available: { type: 'boolean' },
  },
  ['provider', 'model', 'name', 'available'],
)

/** Schema of one registered LLM provider row. */
const PROVIDER_VIEW_SCHEMA = objectSchema(
  {
    provider: { type: 'string' },
    name: { type: 'string' },
    available: { type: 'boolean' },
  },
  ['provider', 'name', 'available'],
)

const MODEL_LIST_VALUE_SCHEMA = objectSchema(
  {
    available: { type: 'boolean' },
    source: { type: 'string', enum: ['config', 'host', 'session'] },
    providers: { type: 'array', items: PROVIDER_VIEW_SCHEMA },
    allowedModels: { type: 'array', items: MODEL_VIEW_SCHEMA },
    models: { type: 'array', items: MODEL_VIEW_SCHEMA },
    sessionModel: { type: 'object' },
  },
  ['available', 'source', 'providers', 'allowedModels', 'models'],
)

const SEND_VALUE_SCHEMA = objectSchema(
  {
    messageId: { type: 'string' },
    target: { type: 'string' },
  },
  ['messageId', 'target'],
)

const INTERRUPT_VALUE_SCHEMA = objectSchema({
  accepted: { type: 'boolean' },
  previousStatus: { type: 'string' },
})

/** Schema of one shared team task row. */
const TASK_VIEW_SCHEMA = objectSchema(
  {
    id: { type: 'string' },
    revision: { type: 'integer' },
    subject: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'deleted'] },
    ownerName: { type: 'string' },
    blockedBy: { type: 'array', items: { type: 'string' } },
    writeScopes: { type: 'array', items: { type: 'string' } },
    ready: { type: 'boolean' },
    writeScopeWarnings: { type: 'array', items: { type: 'string' } },
  },
  ['id', 'revision', 'subject', 'description', 'status', 'blockedBy', 'writeScopes', 'ready', 'writeScopeWarnings'],
)

const TASK_LIST_VALUE_SCHEMA = objectSchema(
  {
    tasks: { type: 'array', items: TASK_VIEW_SCHEMA },
    nextCursor: { type: 'integer' },
  },
  ['tasks'],
)

/** Guard used by every tool: the calling agent is the authority for its session. */
function callingAgent(exec, toolName) {
  if (!exec.agent) throw new Error(`${toolName} requires a calling agent (exec.agent was undefined)`)
  return exec.agent
}

/**
 * Build the core management tools.
 *
 * @param {{
 *   manager: {
 *     overview: Function,
 *     listAgents: Function,
 *     listModels: Function,
 *     spawn: Function,
 *     send: Function,
 *     interrupt: Function,
 *   },
 *   settings: { maxList: () => number, memberProvider: () => 'spawn' | 'fork' },
 * }} deps
 * @returns {Array<object>} tool definitions.
 */
export function buildManagerTools({ manager, settings }) {
  return [
    {
      name: 'agent_manager_list',
      description:
        'List the persistent agent definitions (created in Settings) plus the sub-agents spawned under this session, with live status, and the Agent Teams roster/task board when mounted. Read-only overview.',
      parameters: parametersSchema({
        max: {
          type: 'integer',
          description: 'Maximum child rows to return, from 1 through 200. Defaults to the configured limit.',
        },
      }),
      output: jsonOutput(CHILD_LIST_VALUE_SCHEMA),
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        callingAgent(exec, 'agent_manager_list')
        const overview = await manager.overview(exec.agent.id, { limit: args.max ?? settings.maxList() })
        return { ...overview, agents: manager.listAgents().agents }
      },
    },
    {
      name: 'agent_manager_spawn',
      description:
        'Spawn a persistent agent (defined in Settings) into a session with a specific task. The agent runs its base prompt plus the task in a new continuable child session; use agent_manager_message to continue it later. Defaults to this session.',
      parameters: parametersSchema({
        agent: {
          type: 'string',
          required: true,
          description: 'Agent definition id or name, as returned by agent_manager_list.',
        },
        task: {
          type: 'string',
          required: true,
          description: 'The concrete task for this run.',
        },
        session: {
          type: 'string',
          description: 'Target session id. Omit to use the calling session.',
        },
        provider: {
          type: 'string',
          enum: ['spawn', 'fork'],
          description: 'Backend override; defaults to the definition’s provider.',
        },
        model_provider: {
          type: 'string',
          description:
            'LLM provider id for an auto-mode agent. Use agent_manager_list_models to discover allowed routes. Ignored when the definition pins or inherits its model.',
        },
        model: {
          type: 'string',
          description:
            'LLM model id for an auto-mode agent; supply together with model_provider. Ignored when the definition pins or inherits its model.',
        },
      }),
      output: jsonOutput(SPAWN_VALUE_SCHEMA),
      async execute(args, exec) {
        callingAgent(exec, 'agent_manager_spawn')
        const sessionId = args.session ?? exec.agent.id
        return manager.spawn({
          sessionId,
          agentId: args.agent,
          task: args.task,
          provider: args.provider,
          modelProvider: args.model_provider,
          modelName: args.model,
        })
      },
    },
    {
      name: 'agent_manager_list_models',
      description:
        'List the LLM routes this session’s coordinator may assign to auto-mode agents. Fixed agents ignore this list and use their own route; when no distribution routes are configured, agents inherit the session model. Read-only.',
      parameters: parametersSchema({}),
      output: jsonOutput(MODEL_LIST_VALUE_SCHEMA),
      isConcurrencySafe: () => true,
      async execute(_args, exec) {
        callingAgent(exec, 'agent_manager_list_models')
        return manager.listModels({ sessionId: exec.agent.id, scope: 'allowed' })
      },
    },
    {
      name: 'agent_manager_message',
      description:
        'Send a message to an agent managed by this session: a direct child id, or — when the Agent Teams runtime is mounted and this session is the Team Lead — a teammate name. A running target receives it at its next step; an idle target starts a new turn.',
      parameters: parametersSchema({
        agent_id: {
          type: 'string',
          required: true,
          description: 'Direct child session id, or a teammate name when a team is active.',
        },
        message: {
          type: 'string',
          required: true,
          description: 'Self-contained message for the target agent.',
        },
      }),
      output: jsonOutput(SEND_VALUE_SCHEMA),
      async execute(args, exec) {
        const agent = callingAgent(exec, 'agent_manager_message')
        return manager.send({ sessionId: agent.id, target: args.agent_id, message: args.message })
      },
    },
    {
      name: 'agent_manager_interrupt',
      description:
        'Ask an agent managed by this session to stop its current work. The call returns without waiting for the target to quiesce; a direct child can be continued later with agent_manager_message. Teammates are interruptible from the Team Lead.',
      parameters: parametersSchema({
        agent_id: {
          type: 'string',
          required: true,
          description: 'Direct child session id, or a teammate name when a team is active.',
        },
      }),
      output: jsonOutput(INTERRUPT_VALUE_SCHEMA),
      async execute(args, exec) {
        const agent = callingAgent(exec, 'agent_manager_interrupt')
        return manager.interrupt({ sessionId: agent.id, target: args.agent_id })
      },
    },
  ]
}

/**
 * Build the shared task-board tools for the Agent Teams runtime.
 *
 * @param {{
 *   ctx: { get: (name: string) => unknown },
 * }} deps
 * @returns {Array<object>} tool definitions (empty when the service is absent).
 */
export function buildTeamTools({ ctx }) {
  const teamService = ctx.get('agentTeams')
  if (!teamService) return []

  const guard = (exec, toolName) => {
    const agent = callingAgent(exec, toolName)
    const membership = teamService.tryMembership(agent)
    if (!membership) throw new Error(`${toolName}: this session is not part of an active Agent Team`)
    return agent
  }

  return [
    {
      name: 'agent_manager_task_create',
      description: 'Create one unowned pending task on the shared team task board.',
      parameters: parametersSchema({
        subject: { type: 'string', required: true, description: 'Concise task title.' },
        description: { type: 'string', required: true, description: 'Complete task details and acceptance criteria.' },
        blocked_by: { type: 'array', items: { type: 'string' }, description: 'Task ids that must complete first.' },
        write_scopes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Advisory workspace-relative file or directory prefixes this task expects to modify.',
        },
      }),
      output: jsonOutput(TASK_VIEW_SCHEMA),
      async execute(args, exec) {
        const agent = guard(exec, 'agent_manager_task_create')
        return teamService.createTask(agent, {
          subject: args.subject,
          description: args.description,
          ...(Array.isArray(args.blocked_by) ? { blockedBy: args.blocked_by } : {}),
          ...(Array.isArray(args.write_scopes) ? { writeScopes: args.write_scopes } : {}),
        })
      },
    },
    {
      name: 'agent_manager_task_list',
      description: 'List shared team tasks, including readiness, owner, revision, blockers, and write-scope warnings.',
      parameters: parametersSchema({
        status: {
          type: 'string',
          enum: ['pending', 'in_progress', 'completed'],
          description: 'Optional exact status filter.',
        },
        owner: { type: 'string', description: 'Optional member name filter; use unowned for tasks without an owner.' },
        ready: { type: 'boolean', description: 'Optional readiness filter.' },
        cursor: { type: 'integer', description: 'Zero-based result offset. Defaults to 0.' },
        limit: { type: 'integer', description: 'Number of rows, 1 through 100. Defaults to 50.' },
      }),
      output: jsonOutput(TASK_LIST_VALUE_SCHEMA),
      execute(args, exec) {
        const agent = guard(exec, 'agent_manager_task_list')
        const tasks = teamService.listTasks(agent)
        const status = args.status
        const filtered = tasks.filter(
          (task) =>
            (status === undefined || task.status === status) &&
            (args.owner === undefined ||
              (args.owner === 'unowned' ? task.ownerName === undefined : task.ownerName === args.owner)) &&
            (args.ready === undefined || task.ready === args.ready),
        )
        const cursor = args.cursor ?? 0
        const limit = args.limit ?? 50
        if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error('cursor must be a non-negative safe integer')
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
          throw new Error('limit must be an integer from 1 through 100')
        }
        return {
          tasks: filtered.slice(cursor, cursor + limit),
          ...(cursor + limit < filtered.length ? { nextCursor: cursor + limit } : {}),
        }
      },
    },
    {
      name: 'agent_manager_task_update',
      description:
        'Compare-and-set a shared team task action using the latest revision from agent_manager_task_list or agent_manager_task_create.',
      parameters: parametersSchema({
        task_id: { type: 'string', required: true, description: 'Shared task id.' },
        expected_revision: {
          type: 'integer',
          required: true,
          description: 'Current task revision used as the compare-and-set precondition.',
        },
        action: {
          type: 'string',
          required: true,
          enum: ['claim', 'release', 'edit', 'set_dependencies', 'complete', 'reopen', 'reassign', 'delete'],
          description: 'Task transition to apply.',
        },
        subject: { type: 'string', description: 'Replacement title for edit.' },
        description: { type: 'string', description: 'Replacement details for edit.' },
        blocked_by: { type: 'array', items: { type: 'string' }, description: 'Complete blocker list for set_dependencies.' },
        write_scopes: { type: 'array', items: { type: 'string' }, description: 'Replacement advisory write scopes for edit.' },
        owner: { type: 'string', description: 'Member name for Lead-only reassign; omit to unassign.' },
      }),
      output: jsonOutput(TASK_VIEW_SCHEMA),
      async execute(args, exec) {
        const agent = guard(exec, 'agent_manager_task_update')
        return teamService.updateTask(agent, {
          taskId: args.task_id,
          expectedRevision: args.expected_revision,
          action: args.action,
          ...(args.subject !== undefined ? { subject: args.subject } : {}),
          ...(args.description !== undefined ? { description: args.description } : {}),
          ...(Array.isArray(args.blocked_by) ? { blockedBy: args.blocked_by } : {}),
          ...(Array.isArray(args.write_scopes) ? { writeScopes: args.write_scopes } : {}),
          ...(args.owner !== undefined ? { owner: args.owner } : {}),
        })
      },
    },
  ]
}
