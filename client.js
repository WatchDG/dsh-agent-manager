window.__ModuleLoader__.load({
  id: 'dsh-agent-manager',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Dictionary namespace owned by this plugin. */
    const NS = 'settings.agents'
    /** Host Loader row id; the settings namespace is the row's patch id. */
    const HOST_ENTRY = 'agent-manager'
    /** Tolerate a Loader that namespaces the inserted row. */
    const NAMESPACES = [HOST_ENTRY, `include:${HOST_ENTRY}`, 'dsh-agent-manager']

    /** Authenticated Host routes registered by lib/plugin.js. */
    const OVERVIEW_PATH = '/agents/overview'
    const SESSIONS_PATH = '/agents/sessions'
    const CREATE_PATH = '/agents/create'
    const MESSAGE_PATH = '/agents/message'
    const INTERRUPT_PATH = '/agents/interrupt'

    /** English copy. */
    const en = {
      nav: 'Agents',
      title: 'Agent Manager',
      intro:
        'Manage the sub-agents of your sessions: create continuable agents, list them with live status, send follow-up messages, and interrupt running turns. The Agent Teams roster and task board are included when the Host team runtime is mounted.',
      loading: 'Loading agents…',
      loadFailed: 'Could not load the agent list right now.',
      unavailable: 'The agent manager service is unavailable in this profile.',
      empty: 'No agents created under this session yet. Use the form below to create one.',
      members: 'Managed agents',
      tasks: 'Shared team tasks',
      noTasks: 'No shared tasks.',
      createTitle: 'Create agent',
      nameLabel: 'Name',
      nameHint: 'Short human-readable label (up to 80 characters).',
      descLabel: 'Description',
      descHint: 'One line about the delegated responsibility (up to 200 characters).',
      promptLabel: 'Initial prompt',
      promptHint: 'Complete self-contained task for the new agent.',
      providerLabel: 'Backend',
      providerHint: 'spawn starts a fresh context; fork inherits this session’s completed turns.',
      spawnOption: 'Spawn (fresh context)',
      forkOption: 'Fork (inherit this chat)',
      createButton: 'Create agent',
      creating: 'Creating…',
      created: 'Agent created.',
      createFailed: 'Creation failed.',
      messagePlaceholder: 'Message to this agent…',
      send: 'Send',
      sending: 'Sending…',
      sent: 'Sent.',
      sendFailed: 'Could not send.',
      interrupt: 'Interrupt',
      interrupting: 'Interrupting…',
      interrupted: 'Interrupt requested.',
      interruptFailed: 'Could not interrupt.',
      refresh: 'Refresh',
      copyId: 'Copy session id',
      copied: 'Copied.',
      running: 'running',
      inactive: 'inactive',
      mode_oneShot: 'one-shot',
      modeExternal: 'external',
      modeContinuable: 'continuable',
      modeUnknown: 'unknown',
      status: 'Status',
      roleLead: 'lead',
      roleTeammate: 'teammate',
      close: 'Close',
      headerActionLabel: 'Conversation header action',
      headerActionHint: 'Show the “Agents” action in an open conversation header.',
      refreshLabel: 'Auto-refresh (ms)',
      refreshHint: 'Panel refresh interval, from 1000 through 60000 ms.',
      sessionsLabel: 'Session',
      sessionsHint: 'The agent will be created under this live session.',
      noSessions: 'No live sessions available — open one first.',
    }

    /** Russian copy. */
    const ru = {
      nav: 'Агенты',
      title: 'Менеджер агентов',
      intro:
        'Управляйте субагентами своих сессий: создавайте продолжаемых агентов, просматривайте их со статусом, отправляйте уточняющие сообщения и прерывайте запущенные ходы. Состав команды и доска задач Agent Teams включаются, когда рантайм команд смонтирован на хосте.',
      loading: 'Загружаю агентов…',
      loadFailed: 'Не удалось загрузить список агентов.',
      unavailable: 'Сервис менеджера агентов недоступен в этом профиле.',
      empty: 'Под этой сессией ещё нет агентов. Воспользуйтесь формой ниже, чтобы создать первого.',
      members: 'Управляемые агенты',
      tasks: 'Общие задачи команды',
      noTasks: 'Общих задач нет.',
      createTitle: 'Создать агента',
      nameLabel: 'Имя',
      nameHint: 'Короткая понятная метка (до 80 символов).',
      descLabel: 'Описание',
      descHint: 'Одна строка о делегированной ответственности (до 200 символов).',
      promptLabel: 'Начальный промпт',
      promptHint: 'Полная самостоятельная задача для нового агента.',
      providerLabel: 'Бэкенд',
      providerHint: 'spawn начинает с чистого контекста; fork наследует завершённые ходы этой сессии.',
      spawnOption: 'Spawn (чистый контекст)',
      forkOption: 'Fork (унаследовать чат)',
      createButton: 'Создать агента',
      creating: 'Создаю…',
      created: 'Агент создан.',
      createFailed: 'Не удалось создать.',
      messagePlaceholder: 'Сообщение агенту…',
      send: 'Отправить',
      sending: 'Отправляю…',
      sent: 'Отправлено.',
      sendFailed: 'Не удалось отправить.',
      interrupt: 'Прервать',
      interrupting: 'Прерываю…',
      interrupted: 'Прерывание запрошено.',
      interruptFailed: 'Не удалось прервать.',
      refresh: 'Обновить',
      copyId: 'Скопировать id сессии',
      copied: 'Скопировано.',
      running: 'работает',
      inactive: 'неактивен',
      mode_oneShot: 'одноразовый',
      modeExternal: 'внешний',
      modeContinuable: 'продолжаемый',
      modeUnknown: 'неизвестный',
      status: 'Статус',
      roleLead: 'лидер',
      roleTeammate: 'участник',
      close: 'Закрыть',
      headerActionLabel: 'Действие в шапке беседы',
      headerActionHint: 'Показывать кнопку «Агенты» в шапке открытой беседы.',
      refreshLabel: 'Автообновление (мс)',
      refreshHint: 'Интервал обновления панели, от 1000 до 60000 мс.',
      sessionsLabel: 'Сессия',
      sessionsHint: 'Агент будет создан под этой живой сессией.',
      noSessions: 'Нет живых сессий — сначала откройте одну.',
    }

    /** Panel styles; theme tokens only, so light/dark follows the host theme. */
    const CSS = `
.am-section{display:flex;flex-direction:column;gap:20px;width:100%;max-width:640px;padding:4px 0 24px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}
.am-title{margin:0;font-size:16px;font-weight:600}
.am-sub{margin:24px 0 0;padding-top:16px;border-top:.5px solid var(--dsw-alias-border-l1);font-size:16px;font-weight:600}
.am-intro{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:19px}
.am-card{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:12px;line-height:18px}
.am-status{color:var(--dsw-alias-label-secondary)}
.am-error{color:var(--dsw-alias-state-error-primary)}
.am-row{display:flex;flex-direction:column;gap:6px}
.am-label{font-size:13px;font-weight:500}
.am-input,.am-select{height:32px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.am-textarea{min-height:72px;padding:6px 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;resize:vertical}
.am-input:focus-visible,.am-select:focus-visible,.am-textarea:focus-visible,.am-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.am-input:disabled,.am-select:disabled,.am-textarea:disabled{color:var(--dsw-alias-label-secondary);cursor:not-allowed}
.am-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.am-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.am-button{height:32px;padding:0 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;cursor:pointer}
.am-button:disabled{color:var(--dsw-alias-label-secondary);cursor:not-allowed}
.am-button.danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.am-root{position:relative}
.am-trigger{min-height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:transparent;border:0;border-radius:6px;display:inline-flex;align-items:center;gap:5px;padding:3px 7px;font-size:12px}
.am-trigger:hover,.am-trigger:focus-visible{color:var(--dsw-alias-label-primary)}
.am-panel{box-sizing:border-box;position:absolute;top:calc(100% + 8px);right:-4px;width:min(480px,calc(100vw - 32px));max-height:min(640px,calc(100vh - 120px));overflow:hidden;display:flex;flex-direction:column;border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-prominent);z-index:100}
.am-panelBody{overflow-y:auto;padding:4px 12px 14px;min-height:0;flex:auto}
.am-panelFooter{display:flex;justify-content:flex-end;padding:8px 12px;border-top:.5px solid var(--dsw-alias-border-l1)}
.am-list{display:flex;flex-direction:column;gap:8px}
.am-agent{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2)}
.am-agentHead{display:flex;align-items:center;gap:8px}
.am-dot{width:8px;height:8px;border-radius:50%;flex:none}
.am-dot.running{background:var(--dsw-alias-state-success-primary)}
.am-dot.inactive{background:var(--dsw-alias-label-tertiary)}
.am-agentName{font-size:13px;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.am-agentMeta{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.am-agentRow{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.am-send{display:flex;flex-direction:column;gap:6px}
.am-empty{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;padding:4px 0}
.am-teamCard{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:8px 10px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:12px;line-height:18px}
.am-task{display:flex;flex-direction:column;gap:2px;padding:6px 8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:6px}
.am-taskTitle{font-weight:600;font-size:12px}
`

    /** Fetch JSON from an authenticated Host route. */
    async function getJson(path, query) {
      const response = await fetch(query ? `${path}?${query}` : path, {
        method: 'GET',
        headers: { accept: 'application/json' },
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`agent-manager: HTTP ${response.status}`)
      return response.json()
    }

    /** POST JSON to an authenticated Host route. */
    async function postJson(path, body) {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error(`agent-manager: HTTP ${response.status}`)
      return response.json()
    }

    /** Copy text, with a legacy fallback for older WebViews. */
    function copyText(text) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
      }
      return new Promise((resolve, reject) => {
        try {
          const area = document.createElement('textarea')
          area.value = text
          area.style.position = 'fixed'
          area.style.opacity = '0'
          document.body.appendChild(area)
          area.select()
          const ok = document.execCommand('copy')
          document.body.removeChild(area)
          if (ok) resolve()
          else reject(new Error('copy failed'))
        } catch (error) {
          reject(error)
        }
      })
    }

    /** One labeled form row. */
    function Field(props) {
      const { id, label, hint, children } = props
      return h(
        'div',
        { className: 'am-row' },
        h('label', { className: 'am-label', htmlFor: id }, label),
        children,
        hint ? h('div', { className: 'am-hint', id: `${id}-hint` }, hint) : null,
      )
    }

    /**
     * The conversation-header “Agents” action: a trigger button and a panel
     * listing managed agents with create/message/interrupt controls.
     */
    function AgentsAction(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => en[key] ?? key
      const sessionId = props.sessionId
      const enabled = props.enabled !== false
      const refreshMs = props.refreshMs ?? 5000
      const [open, setOpen] = React.useState(false)
      const [state, setState] = React.useState({ status: 'idle', payload: null })
      const [create, setCreate] = React.useState({ open: false, pending: false, done: false })
      const [form, setForm] = React.useState({ name: '', description: '', prompt: '', provider: 'spawn' })
      const [mail, setMail] = React.useState({})
      const [busy, setBusy] = React.useState({})
      const rootRef = React.useRef(null)

      const load = React.useCallback(() => {
        if (!sessionId) return
        setState((previous) => ({ ...previous, status: previous.status === 'ready' ? 'ready' : 'loading' }))
        getJson(OVERVIEW_PATH, `session=${encodeURIComponent(sessionId)}`)
          .then((response) => {
            if (!response.ok) throw new Error(response.error ?? 'overview failed')
            setState({ status: 'ready', payload: response.data })
          })
          .catch(() => setState({ status: 'failed', payload: null }))
      }, [sessionId])

      React.useEffect(() => {
        if (!open || !enabled) return
        load()
        const timer = setInterval(load, refreshMs)
        return () => clearInterval(timer)
      }, [open, enabled, refreshMs, load])

      React.useEffect(() => {
        if (!open) return
        const onKey = (event) => {
          if (event.key === 'Escape') setOpen(false)
        }
        const onPointer = (event) => {
          if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        document.addEventListener('pointerdown', onPointer)
        return () => {
          document.removeEventListener('keydown', onKey)
          document.removeEventListener('pointerdown', onPointer)
        }
      }, [open])

      if (!sessionId || !enabled) return null

      const doCreate = () => {
        if (create.pending) return
        setCreate({ open: true, pending: true, done: false })
        postJson(CREATE_PATH, { session: sessionId, ...form })
          .then((response) => {
            if (!response.ok) throw new Error(response.error ?? 'create failed')
            setCreate({ open: false, pending: false, done: true })
            setForm({ name: '', description: '', prompt: '', provider: 'spawn' })
            load()
          })
          .catch(() => setCreate({ open: true, pending: false, done: false }))
      }

      const doSend = (agentId) => {
        if (busy[agentId]) return
        const message = (mail[agentId] ?? '').trim()
        if (!message) return
        setBusy((previous) => ({ ...previous, [agentId]: true }))
        postJson(MESSAGE_PATH, { session: sessionId, target: agentId, message })
          .then((response) => {
            if (!response.ok) throw new Error(response.error ?? 'send failed')
            setMail((previous) => ({ ...previous, [agentId]: '' }))
          })
          .catch(() => undefined)
          .finally(() => setBusy((previous) => ({ ...previous, [agentId]: false })))
      }

      const doInterrupt = (agentId) => {
        if (busy[agentId]) return
        setBusy((previous) => ({ ...previous, [agentId]: true }))
        postJson(INTERRUPT_PATH, { session: sessionId, target: agentId })
          .then((response) => {
            if (!response.ok) throw new Error(response.error ?? 'interrupt failed')
          })
          .catch(() => undefined)
          .finally(() => setBusy((previous) => ({ ...previous, [agentId]: false })))
      }

      const agents = state.status === 'ready' && state.payload ? state.payload.agents ?? [] : []
      const team = state.status === 'ready' && state.payload ? state.payload.team : null

      const section = (title, children) =>
        h('section', { className: 'am-section-inline', style: { marginTop: 10 } }, h('h3', { className: 'am-sub' }, title), children)

      const body = h(
        'div',
        { className: 'am-panelBody' },
        state.status === 'failed'
          ? h('div', { className: 'am-error', role: 'alert' }, t('loadFailed'))
          : state.status === 'idle' || state.status === 'loading'
            ? h('div', { className: 'am-status' }, t('loading'))
            : h(
                React.Fragment,
                null,
                h('p', { className: 'am-intro' }, t('intro')),
                agents.length === 0
                  ? h('div', { className: 'am-empty' }, t('empty'))
                  : h(
                      'div',
                      { className: 'am-list' },
                      agents.map((agent) =>
                        h(
                          'div',
                          { className: 'am-agent', key: agent.id },
                          h(
                            'div',
                            { className: 'am-agentHead' },
                            h('span', { className: `am-dot ${agent.active ? 'running' : 'inactive'}` }),
                            h('span', { className: 'am-agentName', title: agent.id }, agent.label ?? agent.id),
                          ),
                          h(
                            'div',
                            { className: 'am-agentMeta' },
                            `${t(agent.active ? 'running' : 'inactive')} · ${t(`mode${agent.mode[0].toUpperCase()}${agent.mode.slice(1)}`)}`,
                          ),
                          h(
                            'div',
                            { className: 'am-agentRow' },
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'am-button',
                                disabled: busy[agent.id] === true,
                                onClick: () => copyText(agent.id).then(() => undefined),
                              },
                              t('copyId'),
                            ),
                            agent.active
                              ? h(
                                  'button',
                                  {
                                    type: 'button',
                                    className: 'am-button danger',
                                    disabled: busy[agent.id] === true,
                                    onClick: () => doInterrupt(agent.id),
                                  },
                                  t('interrupt'),
                                )
                              : null,
                          ),
                          h(
                            'div',
                            { className: 'am-send' },
                            h('textarea', {
                              className: 'am-textarea',
                              placeholder: t('messagePlaceholder'),
                              value: mail[agent.id] ?? '',
                              onChange: (event) =>
                                setMail((previous) => ({ ...previous, [agent.id]: event.target.value })),
                            }),
                            h(
                              'div',
                              { className: 'am-actions' },
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'am-button',
                                  disabled: busy[agent.id] === true || !(mail[agent.id] ?? '').trim(),
                                  onClick: () => doSend(agent.id),
                                },
                                t('send'),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                team && team.members.length > 0
                  ? section(
                      t('members'),
                      h(
                        'div',
                        { className: 'am-list' },
                        team.members.map((member) =>
                          h(
                            'div',
                            { className: 'am-agent', key: member.name },
                            h(
                              'div',
                              { className: 'am-agentHead' },
                              h('span', { className: `am-dot ${member.status === 'running' || member.status === 'provisioning' ? 'running' : 'inactive'}` }),
                              h('span', { className: 'am-agentName' }, member.name),
                            ),
                            h(
                              'div',
                              { className: 'am-agentMeta' },
                              `${t(member.role === 'lead' ? 'roleLead' : 'roleTeammate')} · ${t(member.status === 'running' ? 'running' : 'inactive')}`,
                            ),
                          ),
                        ),
                      ),
                    )
                  : null,
                team && team.tasks.length > 0
                  ? section(
                      t('tasks'),
                      h(
                        'div',
                        { className: 'am-teamCard' },
                        team.tasks.map((task) =>
                          h(
                            'div',
                            { className: 'am-task', key: task.id },
                            h('span', { className: 'am-taskTitle' }, task.subject),
                            h('span', { className: 'am-agentMeta' }, `${task.id} · ${task.status} · ${task.ownerName ?? 'unowned'}`),
                          ),
                        ),
                      ),
                    )
                  : null,
              ),
      )

      return h(
        'div',
        { className: 'am-root', ref: rootRef },
        h(
          'button',
          {
            type: 'button',
            className: 'am-trigger',
            'aria-label': t('nav'),
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            onClick: () => setOpen((current) => !current),
          },
          h(
            'svg',
            { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': true },
            h('path', {
              d: 'M8 1.5a2.75 2.75 0 1 0 0 5.5 2.75 2.75 0 0 0 0-5.5Zm0 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM2.75 12.5c0-1.8 2.1-3 5.25-3s5.25 1.2 5.25 3v.75h-10.5v-.75Zm1.5.75h7.5c-.3-1-2-1.5-3.75-1.5s-3.45.5-3.75 1.5Z',
            }),
          ),
          h('span', null, t('nav')),
        ),
        open ? h('div', { className: 'am-panel', role: 'dialog', 'aria-label': t('nav') }, body) : null,
      )
    }

    /**
     * The Settings → Agents management block: pick a live session, create an
     * agent under it with its own prompt, and see the session's managed
     * agents. This is the same manager facade the header panel uses.
     */
    function ManageBlock(props) {
      const t = props.t
      const [sessions, setSessions] = React.useState(null)
      const [selected, setSelected] = React.useState('')
      const [overview, setOverview] = React.useState(null)
      const [form, setForm] = React.useState({ name: '', description: '', prompt: '', provider: 'spawn' })
      const [busy, setBusy] = React.useState(false)
      const [notice, setNotice] = React.useState('')

      React.useEffect(() => {
        let alive = true
        getJson(SESSIONS_PATH)
          .then((response) => {
            if (!alive) return
            if (!response.ok) throw new Error(response.error ?? 'sessions failed')
            const list = response.data.sessions ?? []
            setSessions(list)
            if (list.length > 0) setSelected((current) => current || list[0].id)
          })
          .catch(() => {
            if (alive) setSessions([])
          })
        return () => {
          alive = false
        }
      }, [])

      React.useEffect(() => {
        if (!selected) {
          setOverview(null)
          return
        }
        let alive = true
        getJson(OVERVIEW_PATH, `session=${encodeURIComponent(selected)}`)
          .then((response) => {
            if (alive && response.ok) setOverview(response.data)
          })
          .catch(() => {
            if (alive) setOverview(null)
          })
        return () => {
          alive = false
        }
      }, [selected])

      const doCreate = () => {
        if (busy || !selected) return
        setBusy(true)
        setNotice('')
        postJson(CREATE_PATH, { session: selected, ...form })
          .then((response) => {
            if (!response.ok) throw new Error(response.error ?? 'create failed')
            setNotice(t('created'))
            setForm({ name: '', description: '', prompt: '', provider: 'spawn' })
            return getJson(OVERVIEW_PATH, `session=${encodeURIComponent(selected)}`)
          })
          .then((response) => {
            if (response && response.ok) setOverview(response.data)
          })
          .catch(() => setNotice(t('createFailed')))
          .finally(() => setBusy(false))
      }

      return h(
        'div',
        { className: 'am-management', style: { marginTop: 24 } },
        h('h3', { className: 'am-sub' }, t('createTitle')),
        h(
          Field,
          { id: 'am-session', label: t('sessionsLabel'), hint: t('sessionsHint') },
          sessions === null
            ? h('div', { className: 'am-status' }, t('loading'))
            : sessions.length === 0
              ? h('div', { className: 'am-status' }, t('noSessions'))
              : h(
                  'select',
                  {
                    id: 'am-session',
                    className: 'am-select',
                    value: selected,
                    onChange: (event) => setSelected(event.target.value),
                  },
                  sessions.map((session) =>
                    h('option', { key: session.id, value: session.id }, `${session.id}${session.cwd ? ` · ${session.cwd}` : ''}`),
                  ),
                ),
        ),
        h(
          Field,
          { id: 'am-mg-name', label: t('nameLabel'), hint: t('nameHint') },
          h('input', {
            id: 'am-mg-name',
            className: 'am-input',
            value: form.name,
            onChange: (event) => setForm((previous) => ({ ...previous, name: event.target.value })),
          }),
        ),
        h(
          Field,
          { id: 'am-mg-desc', label: t('descLabel'), hint: t('descHint') },
          h('input', {
            id: 'am-mg-desc',
            className: 'am-input',
            value: form.description,
            onChange: (event) => setForm((previous) => ({ ...previous, description: event.target.value })),
          }),
        ),
        h(
          Field,
          { id: 'am-mg-prompt', label: t('promptLabel'), hint: t('promptHint') },
          h('textarea', {
            id: 'am-mg-prompt',
            className: 'am-textarea',
            value: form.prompt,
            onChange: (event) => setForm((previous) => ({ ...previous, prompt: event.target.value })),
          }),
        ),
        h(
          Field,
          { id: 'am-mg-provider', label: t('providerLabel'), hint: t('providerHint') },
          h(
            'select',
            {
              id: 'am-mg-provider',
              className: 'am-select',
              value: form.provider,
              onChange: (event) => setForm((previous) => ({ ...previous, provider: event.target.value })),
            },
            h('option', { value: 'spawn' }, t('spawnOption')),
            h('option', { value: 'fork' }, t('forkOption')),
          ),
        ),
        h(
          'div',
          { className: 'am-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'am-button',
              disabled: busy || !selected || !form.name.trim() || !form.description.trim() || !form.prompt.trim(),
              onClick: doCreate,
            },
            busy ? t('creating') : t('createButton'),
          ),
        ),
        notice
          ? h(
              'div',
              {
                className: notice === t('createFailed') ? 'am-error' : 'am-status',
                role: notice === t('createFailed') ? 'alert' : 'status',
              },
              notice,
            )
          : null,
        selected && overview
          ? h(
              'div',
              { style: { marginTop: 20 } },
              h('h3', { className: 'am-sub' }, `${t('members')} · ${overview.total}`),
              overview.agents.length === 0
                ? h('div', { className: 'am-empty' }, t('empty'))
                : h(
                    'div',
                    { className: 'am-list' },
                    overview.agents.map((agent) =>
                      h(
                        'div',
                        { className: 'am-agent', key: agent.id },
                        h(
                          'div',
                          { className: 'am-agentHead' },
                          h('span', { className: `am-dot ${agent.active ? 'running' : 'inactive'}` }),
                          h('span', { className: 'am-agentName' }, agent.label ?? agent.id),
                        ),
                        h(
                          'div',
                          { className: 'am-agentMeta' },
                          `${t(agent.active ? 'running' : 'inactive')} · ${t(`mode${agent.mode[0].toUpperCase()}${agent.mode.slice(1)}`)} · ${agent.id}`,
                        ),
                      ),
                    ),
                  ),
            )
          : null,
      )
    }

    /** The Settings → Agents section. */
    function Section(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => en[key] ?? key
      const useEnv = typeof props.useEnv === 'function' ? props.useEnv : () => ({ status: 'unavailable' })
      const state = useEnv((snapshot) => snapshot) ?? { status: 'unavailable' }
      const [pending, setPending] = React.useState('')
      const [failed, setFailed] = React.useState(false)
      const [saved, setSaved] = React.useState(false)

      if (!props.form) {
        return h(
          React.Fragment,
          null,
          h('h2', { className: 'am-sub' }, t('title')),
          h('div', { className: 'am-status' }, t('unavailable')),
        )
      }
      if (state.status === 'loading') {
        return h(React.Fragment, null, h('h2', { className: 'am-sub' }, t('title')), h('div', { className: 'am-status' }, t('loading')))
      }
      if (state.status === 'unavailable' || state.value === null || typeof state.value !== 'object') {
        return h(
          React.Fragment,
          null,
          h('h2', { className: 'am-sub' }, t('title')),
          h('div', { className: 'am-status' }, t('unavailable')),
        )
      }

      const writable = state.writable === true && typeof props.setField === 'function'
      const disabled = !writable || pending !== ''
      const value = state.value

      const write = (field, next) => {
        if (typeof props.setField !== 'function') return
        setFailed(false)
        setSaved(false)
        setPending(field)
        props
          .setField(field, next)
          .then((accepted) => {
            if (accepted) setSaved(true)
            else setFailed(true)
          })
          .catch(() => setFailed(true))
          .finally(() => setPending(''))
      }

      return h(
        'div',
        { className: 'am-section' },
        h('style', null, CSS),
        h('h2', { className: 'am-title' }, t('title')),
        h('p', { className: 'am-intro' }, t('intro')),
        h(
          Field,
          { id: 'am-provider', label: t('providerLabel'), hint: t('providerHint') },
          h(
            'select',
            {
              id: 'am-provider',
              className: 'am-select',
              value: value.memberProvider ?? 'spawn',
              disabled,
              onChange: (event) => write('memberProvider', event.target.value),
            },
            h('option', { value: 'spawn' }, t('spawnOption')),
            h('option', { value: 'fork' }, t('forkOption')),
          ),
        ),
        h(
          Field,
          { id: 'am-header-action', label: t('headerActionLabel'), hint: t('headerActionHint') },
          h(
            'label',
            { className: 'am-check', style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 } },
            h('input', {
              type: 'checkbox',
              checked: value.headerAction !== false,
              disabled,
              onChange: (event) => write('headerAction', event.target.checked),
            }),
            t('nav'),
          ),
        ),
        h(
          Field,
          { id: 'am-refresh', label: t('refreshLabel'), hint: t('refreshHint') },
          h('input', {
            id: 'am-refresh',
            className: 'am-input',
            type: 'number',
            min: 1000,
            max: 60000,
            step: 500,
            value: value.autoRefreshMs ?? 5000,
            disabled,
            onChange: (event) => {
              const next = Number(event.target.value)
              if (Number.isFinite(next) && next >= 1000) write('autoRefreshMs', Math.min(Math.round(next), 60000))
            },
          }),
        ),
        h(ManageBlock, { t }),
        failed
          ? h('div', { className: 'am-error', role: 'alert' }, t('createFailed'))
          : pending !== ''
            ? h('div', { className: 'am-status', role: 'status' }, t('creating'))
            : saved
              ? h('div', { className: 'am-status', role: 'status' }, t('created'))
              : null,
      )
    }

    /** Required services. `configForms` is provided by the Settings plugin. */
    const inject = ['slots', 'locale', 'configForms']

    /**
     * Register dictionaries, the Settings section, and the conversation-header
     * action while the Host serves the configuration namespace.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, ru }), 'agent-manager: dictionaries')
      const t = ctx.locale.bind(NS)

      ctx.effect(
        () =>
          ctx.configForms.whileServed(NAMESPACES, (served) => {
            const namespace = NAMESPACES.find((candidate) => served.has(candidate))
            if (namespace === undefined) return () => {}
            const form = ctx.configForms.get(namespace)
            return ctx.slots.inject('settings.section', () =>
              ctx.slots.register(
                {
                  name: 'settings.section',
                  id: 'agent-manager',
                  order: 19,
                  label: () => t('nav'),
                  locale: NS,
                  inject: () => ({
                    hooks: { env: form },
                    setField: (field, next) => form.set(field, next),
                    form,
                  }),
                },
                Section,
              ),
            )
          }),
        'agent-manager: settings page',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('conversation.session.header.actions', () =>
            ctx.slots.register(
              {
                name: 'conversation.session.header.actions',
                id: 'agent-manager',
                order: -20,
                label: () => t('nav'),
                locale: NS,
                inject: () => ({
                  t: (key) => t(key),
                  refreshMs: undefined,
                  enabled: true,
                }),
              },
              AgentsAction,
            ),
          ),
        'agent-manager: conversation header action',
      )
    }

    return { inject, apply }
  },
})
