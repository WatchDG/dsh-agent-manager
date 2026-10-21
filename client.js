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
    const LIST_PATH = '/agents/list'
    const SAVE_PATH = '/agents/save'
    const DELETE_AGENT_PATH = '/agents/delete-agent'
    const SPAWN_PATH = '/agents/spawn'
    const MESSAGE_PATH = '/agents/message'
    const INTERRUPT_PATH = '/agents/interrupt'

    /** English copy. */
    const en = {
      nav: 'Agents',
      title: 'Agent Manager',
      intro:
        'Define persistent agents here once — name, description, base prompt, backend — then spawn them into any session with a concrete task from the conversation or this page.',
      loading: 'Loading…',
      loadFailed: 'Could not load data right now.',
      definitions: 'Agents',
      noDefinitions: 'No agents yet. Click “Create agent” to add the first one.',
      createTitle: 'Create agent',
      editTitle: 'Edit agent',
      createAgent: 'Create agent',
      nameLabel: 'Name',
      nameHint: 'Unique, readable name (up to 80 characters).',
      descLabel: 'Description',
      descHint: 'One line about the delegated responsibility (up to 200 characters).',
      promptLabel: 'Base prompt',
      promptHint: 'The agent’s standing instructions; the task is appended when spawning.',
      providerLabel: 'Backend',
      providerHint: 'spawn starts a fresh context; fork inherits the session’s completed turns.',
      spawnOption: 'Spawn (fresh context)',
      forkOption: 'Fork (inherit the chat)',
      saveButton: 'Save agent',
      deleteButton: 'Delete',
      confirmDelete: 'Click again to delete',
      cancel: 'Cancel',
      saving: 'Saving…',
      saved: 'Saved.',
      saveFailed: 'Could not save.',
      deleteFailed: 'Could not delete.',
      spawnTitle: 'Spawn into a session',
      taskLabel: 'Task',
      taskHint: 'The concrete task for this run; appended to the agent’s base prompt.',
      sessionLabel: 'Target session',
      noSessions: 'No live sessions available — open one first, or spawn from a conversation with agent_manager_spawn.',
      spawnButton: 'Spawn agent',
      spawning: 'Spawning…',
      spawned: 'Agent spawned.',
      spawnFailed: 'Could not spawn.',
      members: 'Spawned children',
      empty: 'No children spawned in the selected session yet.',
      running: 'running',
      inactive: 'inactive',
      mode_oneShot: 'one-shot',
      modeExternal: 'external',
      modeContinuable: 'continuable',
      modeUnknown: 'unknown',
      edit: 'Edit',
      close: 'Close',
      send: 'Send',
      sending: 'Sending…',
      sent: 'Sent.',
      sendFailed: 'Could not send.',
      interrupt: 'Interrupt',
      copyId: 'Copy session id',
      copied: 'Copied.',
      messagePlaceholder: 'Message to this agent…',
      headerActionLabel: 'Conversation header action',
      headerActionHint: 'Show the “Agents” action in an open conversation header.',
      refreshLabel: 'Auto-refresh (ms)',
      refreshHint: 'Panel refresh interval, from 1000 through 60000 ms.',
    }

    /** Russian copy. */
    const ru = {
      nav: 'Агенты',
      title: 'Менеджер агентов',
      intro:
        'Определите персистентных агентов один раз — имя, описание, базовый промпт, бэкенд — и затем спавните их в любую сессию с конкретной задачей из беседы или этой страницы.',
      loading: 'Загружаю…',
      loadFailed: 'Не удалось загрузить данные.',
      definitions: 'Агенты',
      noDefinitions: 'Агентов пока нет. Нажмите «Создать агента», чтобы добавить первого.',
      createTitle: 'Создать агента',
      editTitle: 'Изменить агента',
      createAgent: 'Создать агента',
      nameLabel: 'Имя',
      nameHint: 'Уникальное понятное имя (до 80 символов).',
      descLabel: 'Описание',
      descHint: 'Одна строка о делегированной ответственности (до 200 символов).',
      promptLabel: 'Базовый промпт',
      promptHint: 'Постоянные инструкции агента; задача добавляется при спавне.',
      providerLabel: 'Бэкенд',
      providerHint: 'spawn начинает с чистого контекста; fork наследует завершённые ходы сессии.',
      spawnOption: 'Spawn (чистый контекст)',
      forkOption: 'Fork (унаследовать чат)',
      saveButton: 'Сохранить агента',
      deleteButton: 'Удалить',
      confirmDelete: 'Нажмите ещё раз для удаления',
      cancel: 'Отмена',
      saving: 'Сохраняю…',
      saved: 'Сохранено.',
      saveFailed: 'Не удалось сохранить.',
      deleteFailed: 'Не удалось удалить.',
      spawnTitle: 'Спавн в сессию',
      taskLabel: 'Задача',
      taskHint: 'Конкретная задача для запуска; добавляется к базовому промпту агента.',
      sessionLabel: 'Целевая сессия',
      noSessions: 'Нет живых сессий — сначала откройте одну или используйте agent_manager_spawn из беседы.',
      spawnButton: 'Спавнить агента',
      spawning: 'Спавню…',
      spawned: 'Агент создан.',
      spawnFailed: 'Не удалось создать.',
      members: 'Спавненные дети',
      empty: 'В выбранной сессии ещё нет детей.',
      running: 'работает',
      inactive: 'неактивен',
      mode_oneShot: 'одноразовый',
      modeExternal: 'внешний',
      modeContinuable: 'продолжаемый',
      modeUnknown: 'неизвестный',
      edit: 'Изменить',
      close: 'Закрыть',
      send: 'Отправить',
      sending: 'Отправляю…',
      sent: 'Отправлено.',
      sendFailed: 'Не удалось отправить.',
      interrupt: 'Прервать',
      copyId: 'Скопировать id сессии',
      copied: 'Скопировано.',
      messagePlaceholder: 'Сообщение агенту…',
      headerActionLabel: 'Действие в шапке беседы',
      headerActionHint: 'Показывать кнопку «Агенты» в шапке открытой беседы.',
      refreshLabel: 'Автообновление (мс)',
      refreshHint: 'Интервал обновления панели, от 1000 до 60000 мс.',
    }

    /** Panel styles; theme tokens only, so light/dark follows the host theme. */
    const CSS = `
.am-section{display:flex;flex-direction:column;gap:20px;width:100%;max-width:640px;padding:4px 0 24px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}
.am-title{margin:0;font-size:16px;font-weight:600}
.am-sub{margin:24px 0 0;padding-top:16px;border-top:.5px solid var(--dsw-alias-border-l1);font-size:16px;font-weight:600}
.am-intro{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:19px}
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
.am-headRow{display:flex;align-items:center;justify-content:space-between;gap:8px}
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
.am-agentMeta{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;overflow-wrap:anywhere}
.am-prompt{font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;max-height:96px;overflow:auto}
.am-agentRow{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.am-formCard{display:flex;flex-direction:column;gap:12px;padding:12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}
.am-send{display:flex;flex-direction:column;gap:6px}
.am-empty{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;padding:4px 0}
`

    /** Fetch JSON from an authenticated Host route. */
    async function getJson(path, query) {
      const response = await fetch(query ? `${path}?${query}` : path, {
        method: 'GET',
        headers: { accept: 'application/json' },
        cache: 'no-store',
      })
      let payload
      try {
        payload = await response.json()
      } catch {
        throw new Error(`agent-manager: HTTP ${response.status}`)
      }
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? `agent-manager: HTTP ${response.status}`)
      return payload
    }

    /** POST JSON to an authenticated Host route. */
    async function postJson(path, body) {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      })
      let payload
      try {
        payload = await response.json()
      } catch {
        throw new Error(`agent-manager: HTTP ${response.status}`)
      }
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? `agent-manager: HTTP ${response.status}`)
      return payload
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
     * The conversation-header “Agents” action: spawned children of this
     * session with message/interrupt controls. Agent creation lives in
     * Settings (persistent definitions); this panel manages the children.
     */
    function AgentsAction(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => en[key] ?? key
      const sessionId = props.sessionId
      const enabled = props.enabled !== false
      const [open, setOpen] = React.useState(false)
      const [state, setState] = React.useState({ status: 'idle', payload: null })
      const [mail, setMail] = React.useState({})
      const [busy, setBusy] = React.useState({})
      const rootRef = React.useRef(null)

      const load = React.useCallback(() => {
        if (!sessionId) return
        setState((previous) => ({ ...previous, status: previous.status === 'ready' ? 'ready' : 'loading' }))
        getJson(OVERVIEW_PATH, `session=${encodeURIComponent(sessionId)}`)
          .then((response) => setState({ status: 'ready', payload: response.data }))
          .catch(() => setState({ status: 'failed', payload: null }))
      }, [sessionId])

      React.useEffect(() => {
        if (!open || !enabled) return
        load()
        const timer = setInterval(load, 5000)
        return () => clearInterval(timer)
      }, [open, enabled, load])

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

      const doSend = (agentId) => {
        if (busy[agentId]) return
        const message = (mail[agentId] ?? '').trim()
        if (!message) return
        setBusy((previous) => ({ ...previous, [agentId]: true }))
        postJson(MESSAGE_PATH, { session: sessionId, target: agentId, message })
          .then(() => setMail((previous) => ({ ...previous, [agentId]: '' })))
          .catch(() => undefined)
          .finally(() => setBusy((previous) => ({ ...previous, [agentId]: false })))
      }

      const doInterrupt = (agentId) => {
        if (busy[agentId]) return
        setBusy((previous) => ({ ...previous, [agentId]: true }))
        postJson(INTERRUPT_PATH, { session: sessionId, target: agentId })
          .catch(() => undefined)
          .finally(() => setBusy((previous) => ({ ...previous, [agentId]: false })))
      }

      const agents = state.status === 'ready' && state.payload ? state.payload.agents ?? [] : []

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
     * The Settings → Agents block. The agent list is primary: it loads
     * first, and creating/editing opens an inline form from the list.
     * A separate block spawns a defined agent into a chosen session.
     */
    function ManageBlock(props) {
      const t = props.t
      const [defs, setDefs] = React.useState(null)
      const [defsError, setDefsError] = React.useState('')
      const [sessions, setSessions] = React.useState(null)
      const [sessionsError, setSessionsError] = React.useState('')
      const [selectedSession, setSelectedSession] = React.useState('')
      const [creating, setCreating] = React.useState(false)
      const [editingId, setEditingId] = React.useState(null)
      const [form, setForm] = React.useState({ id: null, name: '', description: '', prompt: '', provider: 'spawn' })
      const [saving, setSaving] = React.useState(false)
      const [formNotice, setFormNotice] = React.useState('')
      const [confirmDelete, setConfirmDelete] = React.useState(null)
      const [spawn, setSpawn] = React.useState({ agentId: '', task: '' })
      const [spawning, setSpawning] = React.useState(false)
      const [spawnNotice, setSpawnNotice] = React.useState('')
      const [overview, setOverview] = React.useState(null)
      const [overviewError, setOverviewError] = React.useState('')

      const reloadDefs = React.useCallback(() => {
        getJson(LIST_PATH)
          .then((response) => {
            setDefs(response.data.agents)
            setDefsError('')
          })
          .catch((error) => {
            setDefs([])
            setDefsError(error instanceof Error ? error.message : String(error))
          })
      }, [])

      React.useEffect(() => {
        reloadDefs()
        getJson(SESSIONS_PATH)
          .then((response) => {
            const list = response.data.sessions ?? []
            setSessionsError('')
            setSessions(list)
            if (list.length > 0) setSelectedSession((current) => current || list[0].id)
          })
          .catch((error) => {
            setSessions([])
            setSessionsError(error instanceof Error ? error.message : String(error))
          })
      }, [reloadDefs])

      React.useEffect(() => {
        if (!selectedSession) {
          setOverview(null)
          return
        }
        let alive = true
        getJson(OVERVIEW_PATH, `session=${encodeURIComponent(selectedSession)}`)
          .then((response) => {
            if (alive) {
              setOverview(response.data)
              setOverviewError('')
            }
          })
          .catch((error) => {
            if (alive) {
              setOverview(null)
              setOverviewError(error instanceof Error ? error.message : String(error))
            }
          })
        return () => {
          alive = false
        }
      }, [selectedSession])

      const openCreate = () => {
        setConfirmDelete(null)
        setFormNotice('')
        setEditingId(null)
        setCreating(true)
        setForm({ id: null, name: '', description: '', prompt: '', provider: 'spawn' })
      }

      const openEdit = (agent) => {
        setConfirmDelete(null)
        setFormNotice('')
        setCreating(false)
        setEditingId(agent.id)
        setForm({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          prompt: agent.prompt,
          provider: agent.provider,
        })
      }

      const closeForm = () => {
        setCreating(false)
        setEditingId(null)
        setFormNotice('')
      }

      const doSave = () => {
        if (saving) return
        setSaving(true)
        setFormNotice('')
        postJson(SAVE_PATH, {
          id: form.id,
          name: form.name,
          description: form.description,
          prompt: form.prompt,
          provider: form.provider,
        })
          .then(() => {
            setFormNotice(t('saved'))
            closeForm()
            reloadDefs()
          })
          .catch(() => setFormNotice(t('saveFailed')))
          .finally(() => setSaving(false))
      }

      const doDelete = (id) => {
        if (confirmDelete !== id) {
          setConfirmDelete(id)
          return
        }
        setConfirmDelete(null)
        postJson(DELETE_AGENT_PATH, { id })
          .then(() => {
            if (editingId === id) closeForm()
            reloadDefs()
          })
          .catch(() => undefined)
      }

      const doSpawn = () => {
        if (spawning) return
        setSpawning(true)
        setSpawnNotice('')
        postJson(SPAWN_PATH, {
          session: selectedSession,
          agentId: spawn.agentId,
          task: spawn.task,
        })
          .then(() => {
            setSpawnNotice(t('spawned'))
            setSpawn((previous) => ({ ...previous, task: '' }))
            if (selectedSession) {
              getJson(OVERVIEW_PATH, `session=${encodeURIComponent(selectedSession)}`)
                .then((response) => setOverview(response.data))
                .catch(() => undefined)
            }
          })
          .catch(() => setSpawnNotice(t('spawnFailed')))
          .finally(() => setSpawning(false))
      }

      const formOpen = creating || editingId !== null
      const formTitle = editingId !== null ? t('editTitle') : t('createTitle')

      const agentForm = h(
        'div',
        { className: 'am-formCard' },
        h('div', { className: 'am-agentHead' }, h('span', { className: 'am-agentName' }, formTitle)),
        h(
          Field,
          { id: 'am-def-name', label: t('nameLabel'), hint: t('nameHint') },
          h('input', {
            id: 'am-def-name',
            className: 'am-input',
            value: form.name,
            onChange: (event) => setForm((previous) => ({ ...previous, name: event.target.value })),
          }),
        ),
        h(
          Field,
          { id: 'am-def-desc', label: t('descLabel'), hint: t('descHint') },
          h('input', {
            id: 'am-def-desc',
            className: 'am-input',
            value: form.description,
            onChange: (event) => setForm((previous) => ({ ...previous, description: event.target.value })),
          }),
        ),
        h(
          Field,
          { id: 'am-def-prompt', label: t('promptLabel'), hint: t('promptHint') },
          h('textarea', {
            id: 'am-def-prompt',
            className: 'am-textarea',
            value: form.prompt,
            onChange: (event) => setForm((previous) => ({ ...previous, prompt: event.target.value })),
          }),
        ),
        h(
          Field,
          { id: 'am-def-provider', label: t('providerLabel'), hint: t('providerHint') },
          h(
            'select',
            {
              id: 'am-def-provider',
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
              disabled: saving || !form.name.trim() || !form.description.trim() || !form.prompt.trim(),
              onClick: doSave,
            },
            saving ? t('saving') : t('saveButton'),
          ),
          h(
            'button',
            { type: 'button', className: 'am-button', disabled: saving, onClick: closeForm },
            t('cancel'),
          ),
        ),
        formNotice
          ? h(
              'div',
              {
                className: formNotice === t('saveFailed') ? 'am-error' : 'am-status',
                role: formNotice === t('saveFailed') ? 'alert' : 'status',
              },
              formNotice,
            )
          : null,
      )

      return h(
        'div',
        { className: 'am-management', style: { marginTop: 24 } },
        h(
          'div',
          { className: 'am-headRow' },
          h('h3', { className: 'am-sub', style: { marginTop: 0, paddingTop: 0, borderTop: 'none' } }, t('definitions')),
          h(
            'button',
            { type: 'button', className: 'am-button', onClick: openCreate, disabled: creating || editingId !== null },
            t('createAgent'),
          ),
        ),
        defsError
          ? h('div', { className: 'am-error', role: 'alert' }, defsError)
          : defs === null
            ? h('div', { className: 'am-status' }, t('loading'))
            : defs.length === 0
              ? h('div', { className: 'am-empty' }, t('noDefinitions'))
              : h(
                  'div',
                  { className: 'am-list' },
                  defs.map((agent) =>
                    h(
                      'div',
                      { className: 'am-agent', key: agent.id },
                      h(
                        'div',
                        { className: 'am-agentHead' },
                        h('span', { className: 'am-agentName' }, agent.name),
                      ),
                      agent.description ? h('div', { className: 'am-agentMeta' }, agent.description) : null,
                      h('div', { className: 'am-agentMeta' }, `[${agent.provider}] · ${agent.id}`),
                      agent.prompt ? h('div', { className: 'am-prompt' }, agent.prompt) : null,
                      h(
                        'div',
                        { className: 'am-agentRow' },
                        h(
                          'button',
                          { type: 'button', className: 'am-button', onClick: () => openEdit(agent) },
                          t('edit'),
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'am-button danger',
                            onClick: () => doDelete(agent.id),
                          },
                          confirmDelete === agent.id ? t('confirmDelete') : t('deleteButton'),
                        ),
                      ),
                    ),
                  ),
                ),
        formOpen ? agentForm : null,
        h('h3', { className: 'am-sub' }, t('spawnTitle')),
        h(
          Field,
          { id: 'am-spawn-agent', label: t('definitions') },
          defs === null || defs.length === 0
            ? h('div', { className: 'am-status' }, t('noDefinitions'))
            : h(
                'select',
                {
                  id: 'am-spawn-agent',
                  className: 'am-select',
                  value: spawn.agentId,
                  onChange: (event) => setSpawn((previous) => ({ ...previous, agentId: event.target.value })),
                },
                h('option', { value: '', disabled: true }, '—'),
                defs.map((agent) => h('option', { key: agent.id, value: agent.id }, agent.name)),
              ),
        ),
        h(
          Field,
          { id: 'am-spawn-session', label: t('sessionLabel') },
          sessions === null
            ? h('div', { className: 'am-status' }, t('loading'))
            : sessionsError
              ? h('div', { className: 'am-error', role: 'alert' }, sessionsError)
              : sessions.length === 0
                ? h('div', { className: 'am-status' }, t('noSessions'))
                : h(
                    'select',
                    {
                      id: 'am-spawn-session',
                      className: 'am-select',
                      value: selectedSession,
                      onChange: (event) => setSelectedSession(event.target.value),
                    },
                    sessions.map((session) =>
                      h('option', { key: session.id, value: session.id }, `${session.id}${session.cwd ? ` · ${session.cwd}` : ''}`),
                    ),
                  ),
        ),
        h(
          Field,
          { id: 'am-spawn-task', label: t('taskLabel'), hint: t('taskHint') },
          h('textarea', {
            id: 'am-spawn-task',
            className: 'am-textarea',
            value: spawn.task,
            onChange: (event) => setSpawn((previous) => ({ ...previous, task: event.target.value })),
          }),
        ),
        h(
          'div',
          { className: 'am-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'am-button',
              disabled: spawning || !spawn.agentId || !spawn.task.trim() || !selectedSession,
              onClick: doSpawn,
            },
            spawning ? t('spawning') : t('spawnButton'),
          ),
        ),
        spawnNotice
          ? h(
              'div',
              {
                className: spawnNotice === t('spawnFailed') ? 'am-error' : 'am-status',
                role: spawnNotice === t('spawnFailed') ? 'alert' : 'status',
              },
              spawnNotice,
            )
          : null,
        selectedSession && (overview || overviewError)
          ? h(
              'div',
              { style: { marginTop: 20 } },
              overviewError
                ? h('div', { className: 'am-error', role: 'alert' }, overviewError)
                : h('h3', { className: 'am-sub' }, `${t('members')} · ${overview.total}`),
              overview && overview.agents.length === 0
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
                          h('span', { className: 'am-agentName', title: agent.id }, agent.label ?? agent.id),
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
        h(ManageBlock, { t }),
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
        failed
          ? h('div', { className: 'am-error', role: 'alert' }, t('saveFailed'))
          : pending !== ''
            ? h('div', { className: 'am-status', role: 'status' }, t('saving'))
            : saved
              ? h('div', { className: 'am-status', role: 'status' }, t('saved'))
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
