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
    const MODELS_PATH = '/agents/models'
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
      modelModeLabel: 'Model',
      modelModeHint:
        'inherit uses the spawning session’s model; auto lets the coordinator choose a distribution model; fixed always uses the exact route below.',
      modelInheritOption: 'Inherit from the session',
      modelAutoOption: 'Coordinator chooses',
      modelFixedOption: 'Fixed model',
      modelProviderLabel: 'Model provider',
      modelNameLabel: 'Model id',
      modelProviderHint: 'Choose the LLM provider from the discovered list.',
      modelNameHint: 'Choose one of the models advertised by the selected provider.',
      modelFixedHint: 'The agent always runs with this provider/model; the coordinator cannot override it.',
      modelAutoHint: 'The coordinator may choose from the distribution models; without a choice the session model is used.',
      modelInheritHint: 'The child inherits the model of the session that spawns it.',
      modelUnset: 'not set',
      distributionTitle: 'Distribution models',
      distributionHint:
        'Exact models the coordinator may assign to auto-mode agents. Leave this list empty to use the Host Subagent model-selection policy; when that is empty too, agents inherit the session model.',
      distributionSourceConfig: 'This list overrides the Host Subagent model-selection policy.',
      distributionSourceHost: 'This plugin list is empty; the Host Subagent model-selection policy is used.',
      distributionSourceSession: 'No distribution models are configured; agents use the session model.',
      distributionUnavailable: 'Saved but not advertised right now',
      distributionEmpty: 'No models discovered. Configure an LLM provider in DSH first.',
      distributionAdd: 'Add route',
      distributionLoading: 'Loading models…',
      distributionLoadFailed: 'Could not load the model catalog.',
      distributionProviderPlaceholder: 'Select provider',
      distributionModelPlaceholder: 'Select model',
      modelNoProviders: 'No LLM providers discovered. Configure a model provider in DSH first.',
      modelNoModelsForProvider: 'This provider advertises no models.',
      spawnModelLabel: 'Model for this run',
      spawnModelHint:
        'Honored only for auto-mode agents and only for a configured distribution model. Fixed agents use their own model; inherit agents use the session model.',
      spawnModelSession: 'Use the session model',
      spawnModelFixed: 'Fixed model',
      spawnModelInherit: 'Uses the session model',
      modelCatalogFailed: 'Model suggestions could not be loaded; type the ids manually.',
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
      modelModeLabel: 'Модель',
      modelModeHint:
        'inherit использует модель сессии, из которой запускают агента; auto позволяет координатору выбрать модель из списка распределения; fixed всегда использует указанный маршрут.',
      modelInheritOption: 'Наследовать от сессии',
      modelAutoOption: 'Выбирает координатор',
      modelFixedOption: 'Фиксированная модель',
      modelProviderLabel: 'Провайдер модели',
      modelNameLabel: 'Id модели',
      modelProviderHint: 'Выберите LLM-провайдера из обнаруженного списка.',
      modelNameHint: 'Выберите одну из моделей, которую объявляет выбранный провайдер.',
      modelFixedHint: 'Агент всегда работает с этой моделью; координатор не может её переопределить.',
      modelAutoHint: 'Координатор может выбрать модель из списка распределения; без выбора используется модель сессии.',
      modelInheritHint: 'Ребёнок наследует модель сессии, из которой его запускают.',
      modelUnset: 'не задана',
      distributionTitle: 'Модели для распределения',
      distributionHint:
        'Точные модели, которые координатор может назначать агентам в режиме auto. Оставьте список пустым, чтобы использовать политику выбора моделей субагентов Host; если она тоже пуста, агенты наследуют модель сессии.',
      distributionSourceConfig: 'Этот список переопределяет политику выбора моделей субагентов Host.',
      distributionSourceHost: 'Список плагина пуст; используется политика выбора моделей субагентов Host.',
      distributionSourceSession: 'Модели для распределения не заданы; агенты используют модель сессии.',
      distributionUnavailable: 'Сохранена, но сейчас не объявляется провайдером',
      distributionEmpty: 'Модели не обнаружены. Сначала настройте LLM-провайдера в DSH.',
      distributionAdd: 'Добавить маршрут',
      distributionLoading: 'Загружаю модели…',
      distributionLoadFailed: 'Не удалось загрузить каталог моделей.',
      distributionProviderPlaceholder: 'Выберите провайдера',
      distributionModelPlaceholder: 'Выберите модель',
      modelNoProviders: 'LLM-провайдеры не обнаружены. Сначала настройте провайдера моделей в DSH.',
      modelNoModelsForProvider: 'Этот провайдер не объявляет моделей.',
      spawnModelLabel: 'Модель для этого запуска',
      spawnModelHint:
        'Учитывается только для агентов в режиме auto и только для модели из списка распределения. Агенты fixed используют свою модель; агенты inherit — модель сессии.',
      spawnModelSession: 'Использовать модель сессии',
      spawnModelFixed: 'Фиксированная модель',
      spawnModelInherit: 'Использует модель сессии',
      modelCatalogFailed: 'Подсказки моделей не загрузились; введите id вручную.',
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
.am-modelList{display:flex;flex-direction:column;gap:2px;max-height:240px;overflow:auto;padding:8px 10px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2)}
.am-modelOption{display:flex;align-items:flex-start;gap:8px;padding:3px 0;font-size:12px;line-height:17px}
.am-modelOption input{margin-top:2px;flex:none}
.am-modelOptionText{min-width:0;display:flex;flex-direction:column;gap:1px}
.am-modelOptionName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.am-modelOptionMeta{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:15px;overflow-wrap:anywhere}
.am-modelAdd{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.am-modelAdd .am-input{flex:1;min-width:130px}
.am-modelSource{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
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

    /** Stable key for an exact provider/model route. */
    function routeKey(route) {
      return `${route.provider}\u0000${route.model}`
    }

    /** Display one route as provider/model. */
    function formatRoute(route) {
      return route ? `${route.provider}/${route.model}` : ''
    }

    /** Whether two routes name the same provider and model. */
    function sameRoute(left, right) {
      return Boolean(left && right && left.provider === right.provider && left.model === right.model)
    }

    /** Human label for a model mode, tolerant of legacy definitions. */
    function modelModeKey(mode) {
      if (mode === 'fixed') return 'modelFixedOption'
      if (mode === 'auto') return 'modelAutoOption'
      return 'modelInheritOption'
    }

    /** Provider select choices from the live catalog and saved routes. */
    function providerChoices(catalog, current) {
      const choices = []
      const seen = new Set()
      const add = (provider, name, available) => {
        if (typeof provider !== 'string' || provider.length === 0 || seen.has(provider)) return
        seen.add(provider)
        choices.push({ provider, name: name || provider, available: available !== false })
      }
      for (const row of catalog.providers ?? []) add(row.provider, row.name, row.available)
      for (const row of catalog.models ?? []) add(row.provider, row.provider, row.available)
      for (const row of catalog.allowedModels ?? []) add(row.provider, row.provider, row.available)
      add(current, current, false)
      return choices.sort((left, right) => left.provider.localeCompare(right.provider))
    }

    /** Model select choices for one provider, keeping the current saved value. */
    function modelChoices(catalog, provider, current) {
      const choices = []
      const seen = new Set()
      const add = (model, name, available) => {
        if (typeof model !== 'string' || model.length === 0 || seen.has(model)) return
        seen.add(model)
        choices.push({ model, name: name || model, available: available !== false })
      }
      for (const row of catalog.models ?? []) {
        if (row.provider !== provider) continue
        add(row.model, row.name, row.available)
      }
      add(current, current, false)
      return choices.sort((left, right) => left.model.localeCompare(right.model))
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
     * Settings block that chooses the exact models the coordinator may hand
     * to auto-mode agents. The Host Subagent model-selection policy is the
     * fallback when this plugin list is empty.
     */
    function ModelPolicyBlock(props) {
      const { t, onChange, disabled } = props
      const [catalog, setCatalog] = React.useState({
        status: 'loading',
        providers: [],
        models: [],
        allowedModels: [],
        source: 'session',
      })
      const [selected, setSelected] = React.useState(null)
      const [draft, setDraft] = React.useState({ provider: '', model: '' })
      const [notice, setNotice] = React.useState('')

      React.useEffect(() => {
        let alive = true
        getJson(MODELS_PATH, 'scope=all')
          .then((response) => {
            if (!alive) return
            const data = response.data ?? {}
            setCatalog({
              status: 'ready',
              providers: Array.isArray(data.providers) ? data.providers : [],
              models: Array.isArray(data.models) ? data.models : [],
              allowedModels: Array.isArray(data.allowedModels) ? data.allowedModels : [],
              source: typeof data.source === 'string' ? data.source : 'session',
            })
            setSelected(null)
          })
          .catch(() => {
            if (!alive) return
            setCatalog({
              status: 'failed',
              providers: [],
              models: [],
              allowedModels: [],
              source: 'session',
            })
          })
        return () => {
          alive = false
        }
      }, [])

      const allowed = selected ?? catalog.allowedModels
      const providerOptions = providerChoices(catalog, draft.provider)
      const modelOptions = modelChoices(catalog, draft.provider, draft.model)
      const sourceKey =
        catalog.source === 'config'
          ? 'distributionSourceConfig'
          : catalog.source === 'host'
            ? 'distributionSourceHost'
            : 'distributionSourceSession'

      const apply = (next) => {
        const previous = allowed
        setSelected(next)
        setNotice('')
        try {
          Promise.resolve(onChange(next))
            .then((accepted) => {
              if (!accepted) {
                setSelected(previous)
                setNotice(t('saveFailed'))
              }
            })
            .catch(() => {
              setSelected(previous)
              setNotice(t('saveFailed'))
            })
        } catch {
          setSelected(previous)
          setNotice(t('saveFailed'))
        }
      }

      const toggle = (route) => {
        if (disabled) return
        const exists = allowed.some((candidate) => sameRoute(candidate, route))
        apply(
          exists
            ? allowed.filter((candidate) => !sameRoute(candidate, route))
            : [...allowed, { provider: route.provider, model: route.model }],
        )
      }

      const addDraft = () => {
        const provider = draft.provider.trim()
        const model = draft.model.trim()
        if (disabled || provider.length === 0 || model.length === 0) return
        if (!allowed.some((candidate) => candidate.provider === provider && candidate.model === model)) {
          apply([...allowed, { provider, model }])
        }
        setDraft({ provider, model: '' })
      }

      const routes = []
      const seen = new Set()
      for (const model of catalog.models) {
        const key = routeKey(model)
        if (seen.has(key)) continue
        seen.add(key)
        routes.push({
          provider: model.provider,
          model: model.model,
          name: model.name || model.model,
          description: model.description,
          available: model.available !== false,
        })
      }
      for (const route of allowed) {
        const key = routeKey(route)
        if (seen.has(key)) continue
        seen.add(key)
        routes.push({
          provider: route.provider,
          model: route.model,
          name: route.model,
          available: false,
        })
      }

      const list =
        catalog.status === 'loading'
          ? h('div', { className: 'am-status' }, t('distributionLoading'))
          : catalog.status === 'failed'
            ? h('div', { className: 'am-error', role: 'alert' }, t('distributionLoadFailed'))
            : routes.length === 0
              ? h('div', { className: 'am-empty' }, t('distributionEmpty'))
              : h(
                  'div',
                  { className: 'am-modelList' },
                  routes.map((route) => {
                    const checked = allowed.some((candidate) => sameRoute(candidate, route))
                    return h(
                      'label',
                      { className: 'am-modelOption', key: routeKey(route) },
                      h('input', {
                        type: 'checkbox',
                        checked,
                        disabled,
                        onChange: () => toggle(route),
                      }),
                      h(
                        'span',
                        { className: 'am-modelOptionText' },
                        h(
                          'span',
                          { className: 'am-modelOptionName' },
                          `${formatRoute(route)}${route.name && route.name !== route.model ? ` — ${route.name}` : ''}`,
                        ),
                        route.available === false || route.description
                          ? h(
                              'span',
                              { className: 'am-modelOptionMeta' },
                              [
                                route.available === false ? t('distributionUnavailable') : '',
                                route.description ?? '',
                              ]
                                .filter(Boolean)
                                .join(' · '),
                            )
                          : null,
                      ),
                    )
                  }),
                )

      return h(
        'div',
        { className: 'am-row' },
        h('div', { className: 'am-label' }, t('distributionTitle')),
        h('div', { className: 'am-hint' }, t('distributionHint')),
        catalog.status === 'ready' && selected === null
          ? h('div', { className: 'am-modelSource' }, t(sourceKey))
          : null,
        list,
        catalog.status !== 'ready'
          ? null
          : providerOptions.length === 0
            ? h('div', { className: 'am-empty' }, t('modelNoProviders'))
            : h(
              React.Fragment,
              null,
              h(
                'div',
                { className: 'am-modelAdd' },
                h(
                  'select',
                  {
                    className: 'am-select',
                    value: draft.provider,
                    disabled,
                    onChange: (event) =>
                      setDraft({ provider: event.target.value, model: '' }),
                  },
                  h('option', { value: '', disabled: true }, t('distributionProviderPlaceholder')),
                  providerOptions.map((option) =>
                    h(
                      'option',
                      { key: option.provider, value: option.provider },
                      `${option.provider}${
                        option.name !== option.provider ? ` — ${option.name}` : ''
                      }${option.available === false ? ` (${t('distributionUnavailable')})` : ''}`,
                    ),
                  ),
                ),
                h(
                  'select',
                  {
                    className: 'am-select',
                    value: draft.model,
                    disabled: disabled || draft.provider.length === 0,
                    onChange: (event) =>
                      setDraft((previous) => ({ ...previous, model: event.target.value })),
                  },
                  h('option', { value: '', disabled: true }, t('distributionModelPlaceholder')),
                  modelOptions.map((option) =>
                    h(
                      'option',
                      { key: option.model, value: option.model },
                      `${option.name}${
                        option.name !== option.model ? ` — ${option.model}` : ''
                      }${option.available === false ? ` (${t('distributionUnavailable')})` : ''}`,
                    ),
                  ),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'am-button',
                    disabled:
                      disabled ||
                      draft.provider.length === 0 ||
                      draft.model.length === 0 ||
                      allowed.some(
                        (route) =>
                          route.provider === draft.provider && route.model === draft.model,
                      ),
                    onClick: addDraft,
                  },
                  t('distributionAdd'),
                ),
              ),
              draft.provider.length > 0 && modelOptions.length === 0
                ? h('div', { className: 'am-status' }, t('modelNoModelsForProvider'))
                : null,
            ),
        notice ? h('div', { className: 'am-error', role: 'alert' }, notice) : null,
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
                            `${t(agent.active ? 'running' : 'inactive')} · ${t(`mode${agent.mode[0].toUpperCase()}${agent.mode.slice(1)}`)}${agent.model ? ` · ${agent.model}` : ''}`,
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
      const [form, setForm] = React.useState({
        id: null,
        name: '',
        description: '',
        prompt: '',
        provider: 'spawn',
        modelMode: 'inherit',
        modelProvider: '',
        modelName: '',
      })
      const [saving, setSaving] = React.useState(false)
      const [formNotice, setFormNotice] = React.useState('')
      const [confirmDelete, setConfirmDelete] = React.useState(null)
      const [spawn, setSpawn] = React.useState({
        agentId: '',
        task: '',
        modelProvider: '',
        modelName: '',
      })
      const [spawning, setSpawning] = React.useState(false)
      const [spawnNotice, setSpawnNotice] = React.useState('')
      const [overview, setOverview] = React.useState(null)
      const [overviewError, setOverviewError] = React.useState('')
      const [modelCatalog, setModelCatalog] = React.useState({
        status: 'loading',
        providers: [],
        models: [],
        allowedModels: [],
        source: 'session',
      })

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
        getJson(MODELS_PATH, 'scope=all')
          .then((response) => {
            const data = response.data ?? {}
            setModelCatalog({
              status: 'ready',
              providers: Array.isArray(data.providers) ? data.providers : [],
              models: Array.isArray(data.models) ? data.models : [],
              allowedModels: Array.isArray(data.allowedModels) ? data.allowedModels : [],
              source: typeof data.source === 'string' ? data.source : 'session',
            })
          })
          .catch(() =>
            setModelCatalog({
              status: 'failed',
              providers: [],
              models: [],
              allowedModels: [],
              source: 'session',
            }),
          )
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
        setForm({
          id: null,
          name: '',
          description: '',
          prompt: '',
          provider: 'spawn',
          modelMode: 'inherit',
          modelProvider: '',
          modelName: '',
        })
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
          modelMode: agent.modelMode ?? 'inherit',
          modelProvider: agent.modelProvider ?? '',
          modelName: agent.modelName ?? '',
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
          modelMode: form.modelMode,
          modelProvider: form.modelMode === 'fixed' ? form.modelProvider : '',
          modelName: form.modelMode === 'fixed' ? form.modelName : '',
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
          modelProvider: spawn.modelProvider,
          modelName: spawn.modelName,
        })
          .then(() => {
            setSpawnNotice(t('spawned'))
            setSpawn((previous) => ({
              ...previous,
              task: '',
              modelProvider: '',
              modelName: '',
            }))
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
      const providerOptions = providerChoices(modelCatalog, form.modelProvider)
      const formModelOptions = modelChoices(modelCatalog, form.modelProvider, form.modelName)
      const spawnDefinition = (defs ?? []).find((agent) => agent.id === spawn.agentId) ?? null
      const distributionModels = modelCatalog.allowedModels
      const selectedModelValue =
        spawn.modelProvider && spawn.modelName
          ? `${spawn.modelProvider}/${spawn.modelName}`
          : ''

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
          Field,
          { id: 'am-def-model-mode', label: t('modelModeLabel'), hint: t('modelModeHint') },
          h(
            'select',
            {
              id: 'am-def-model-mode',
              className: 'am-select',
              value: form.modelMode,
              onChange: (event) => {
                const modelMode = event.target.value
                setForm((previous) => ({
                  ...previous,
                  modelMode,
                  ...(modelMode === 'fixed' ? {} : { modelProvider: '', modelName: '' }),
                }))
              },
            },
            h('option', { value: 'inherit' }, t('modelInheritOption')),
            h('option', { value: 'auto' }, t('modelAutoOption')),
            h('option', { value: 'fixed' }, t('modelFixedOption')),
          ),
        ),
        form.modelMode === 'fixed'
          ? h(
              React.Fragment,
              null,
              modelCatalog.status === 'loading'
                ? h('div', { className: 'am-status' }, t('distributionLoading'))
                : providerOptions.length === 0
                  ? h('div', { className: 'am-empty' }, t('modelNoProviders'))
                  : h(
                      React.Fragment,
                      null,
                    h(
                      Field,
                      {
                        id: 'am-def-model-provider',
                        label: t('modelProviderLabel'),
                        hint: t('modelProviderHint'),
                      },
                      h(
                        'select',
                        {
                          id: 'am-def-model-provider',
                          className: 'am-select',
                          value: form.modelProvider,
                          onChange: (event) =>
                            setForm((previous) => ({
                              ...previous,
                              modelProvider: event.target.value,
                              modelName: '',
                            })),
                        },
                        h(
                          'option',
                          { value: '', disabled: true },
                          t('distributionProviderPlaceholder'),
                        ),
                        providerOptions.map((option) =>
                          h(
                            'option',
                            { key: option.provider, value: option.provider },
                            `${option.provider}${
                              option.name !== option.provider ? ` — ${option.name}` : ''
                            }${
                              option.available === false
                                ? ` (${t('distributionUnavailable')})`
                                : ''
                            }`,
                          ),
                        ),
                      ),
                    ),
                    h(
                      Field,
                      {
                        id: 'am-def-model-name',
                        label: t('modelNameLabel'),
                        hint: t('modelNameHint'),
                      },
                      h(
                        'select',
                        {
                          id: 'am-def-model-name',
                          className: 'am-select',
                          value: form.modelName,
                          disabled: form.modelProvider.length === 0,
                          onChange: (event) =>
                            setForm((previous) => ({
                              ...previous,
                              modelName: event.target.value,
                            })),
                        },
                        h(
                          'option',
                          { value: '', disabled: true },
                          t('distributionModelPlaceholder'),
                        ),
                        formModelOptions.map((option) =>
                          h(
                            'option',
                            { key: option.model, value: option.model },
                            `${option.name}${
                              option.name !== option.model ? ` — ${option.model}` : ''
                            }${
                              option.available === false
                                ? ` (${t('distributionUnavailable')})`
                                : ''
                            }`,
                          ),
                        ),
                      ),
                      formModelOptions.length === 0 && form.modelProvider.length > 0
                        ? h('div', { className: 'am-status' }, t('modelNoModelsForProvider'))
                        : null,
                    ),
                    h('div', { className: 'am-hint' }, t('modelFixedHint')),
                  ),
            )
          : null,
        form.modelMode === 'auto' ? h('div', { className: 'am-hint' }, t('modelAutoHint')) : null,
        form.modelMode === 'inherit' ? h('div', { className: 'am-hint' }, t('modelInheritHint')) : null,
        modelCatalog.status === 'failed'
          ? h('div', { className: 'am-status' }, t('modelCatalogFailed'))
          : null,
        h(
          'div',
          { className: 'am-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'am-button',
              disabled:
                saving ||
                !form.name.trim() ||
                !form.description.trim() ||
                !form.prompt.trim() ||
                (form.modelMode === 'fixed' &&
                  (!form.modelProvider.trim() || !form.modelName.trim())),
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
                      h(
                        'div',
                        { className: 'am-agentMeta' },
                        `[${agent.provider}] · ${t(modelModeKey(agent.modelMode))}${
                          agent.modelMode === 'fixed' && agent.modelProvider && agent.modelName
                            ? ` · ${agent.modelProvider}/${agent.modelName}`
                            : ''
                        } · ${agent.id}`,
                      ),
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
                  onChange: (event) =>
                    setSpawn((previous) => ({
                      ...previous,
                      agentId: event.target.value,
                      modelProvider: '',
                      modelName: '',
                    })),
                },
                h('option', { value: '', disabled: true }, '—'),
                defs.map((agent) => h('option', { key: agent.id, value: agent.id }, agent.name)),
              ),
        ),
        spawnDefinition
          ? h(
              Field,
              { id: 'am-spawn-model', label: t('spawnModelLabel'), hint: t('spawnModelHint') },
              spawnDefinition.modelMode === 'auto'
                ? distributionModels.length === 0
                  ? h('div', { className: 'am-status' }, t('spawnModelSession'))
                  : h(
                      'select',
                      {
                        id: 'am-spawn-model',
                        className: 'am-select',
                        value: selectedModelValue,
                        onChange: (event) => {
                          const value = event.target.value
                          const separator = value.indexOf('/')
                          setSpawn((previous) => ({
                            ...previous,
                            modelProvider: separator > 0 ? value.slice(0, separator) : '',
                            modelName: separator > 0 ? value.slice(separator + 1) : '',
                          }))
                        },
                      },
                      h('option', { value: '' }, t('spawnModelSession')),
                      distributionModels.map((route) =>
                        h(
                          'option',
                          { key: formatRoute(route), value: formatRoute(route) },
                          `${formatRoute(route)}${route.name && route.name !== route.model ? ` — ${route.name}` : ''}`,
                        ),
                      ),
                    )
                : h(
                    'div',
                    { className: 'am-status' },
                    spawnDefinition.modelMode === 'fixed'
                      ? `${t('spawnModelFixed')}: ${
                          spawnDefinition.modelProvider && spawnDefinition.modelName
                            ? `${spawnDefinition.modelProvider}/${spawnDefinition.modelName}`
                            : t('modelUnset')
                        }`
                      : t('spawnModelInherit'),
                  ),
            )
          : null,
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
                          `${t(agent.active ? 'running' : 'inactive')} · ${t(`mode${agent.mode[0].toUpperCase()}${agent.mode.slice(1)}`)}${agent.model ? ` · ${agent.model}` : ''} · ${agent.id}`,
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
        if (typeof props.setField !== 'function') return Promise.resolve(false)
        setFailed(false)
        setSaved(false)
        setPending(field)
        return props
          .setField(field, next)
          .then((accepted) => {
            if (accepted) setSaved(true)
            else setFailed(true)
            return accepted === true
          })
          .catch(() => {
            setFailed(true)
            return false
          })
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
        h(ModelPolicyBlock, {
          t,
          disabled,
          onChange: (routes) => write('allowedModels', routes),
        }),
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
