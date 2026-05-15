const state = {
  view: 'dashboard',
  config: null,
  token: '',
  user: null,
  data: {
    requests: [],
    plaques: [],
    devotees: [],
    jobs: [],
    calendarEvents: [],
  },
  syncMarkers: null,
}

const $ = (selector) => document.querySelector(selector)
const content = $('#content')

function normalizeServerUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

async function apiRequest(path, options = {}) {
  const serverUrl = normalizeServerUrl(state.config?.serverUrl)
  if (!serverUrl) throw new Error('请先配置服务器地址')

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }
  if (state.token) headers.Authorization = `Bearer ${state.token}`

  const response = await fetch(`${serverUrl}${path}`, {
    ...options,
    headers,
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok || json.success === false) {
    throw new Error(json.error || `请求失败：${response.status}`)
  }
  return options.method && options.method !== 'GET' ? json : json.data
}

async function saveConfig(patch) {
  state.config = { ...(state.config || {}), ...patch }
  await window.templeDesktop.setConfig(patch)
}

function setStatus(text) {
  $('#serverStatus').textContent = text
}

function setView(view) {
  state.view = view
  document.querySelectorAll('.nav').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view)
  })
  $('#viewTitle').textContent = {
    dashboard: '工作台',
    registrations: '登记处理',
    plaques: '牌位管理',
    devotees: '信众管理',
    print: '本地打印',
    calendar: '佛事日程',
    diagnostics: '连接诊断',
    settings: '连接设置',
  }[view] || '工作台'
  render()
}

function render() {
  if (!state.token) {
    $('#loginPanel').style.display = 'block'
    content.innerHTML = ''
    return
  }
  $('#loginPanel').style.display = 'none'

  if (state.view === 'dashboard') return renderDashboard()
  if (state.view === 'registrations') return renderList('待处理登记', state.data.requests, item => [
    item.submitterName || '-',
    item.submitterPhone || '-',
    item.taskType || '-',
    item.status || '-',
  ])
  if (state.view === 'plaques') return renderPlaques()
  if (state.view === 'devotees') return renderDevotees()
  if (state.view === 'print') return renderPrint()
  if (state.view === 'calendar') return renderCalendarSettings()
  if (state.view === 'diagnostics') return renderDiagnostics()
  if (state.view === 'settings') return renderSettings()
}

function renderDashboard() {
  const template = $('#dashboardTemplate').content.cloneNode(true)
  template.querySelector('[data-stat="requests"]').textContent = state.data.requests.length
  template.querySelector('[data-stat="plaques"]').textContent = state.data.plaques.length
  template.querySelector('[data-stat="jobs"]').textContent = state.data.jobs.length
  template.querySelector('[data-stat="reports"]').textContent = (state.config.pendingReports || []).length
  template.querySelector('#buddhistCalendar').innerHTML = buildBuddhistCalendar(new Date())
  content.replaceChildren(template)
  bindDashboardControls()
}

const LUNAR_DAY_MAP = {
  初一: 1,
  初二: 2,
  初三: 3,
  初四: 4,
  初五: 5,
  初六: 6,
  初七: 7,
  初八: 8,
  初九: 9,
  初十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
  廿一: 21,
  廿二: 22,
  廿三: 23,
  廿四: 24,
  廿五: 25,
  廿六: 26,
  廿七: 27,
  廿八: 28,
  廿九: 29,
  三十: 30,
}

const LUNAR_MONTH_MAP = {
  正月: 1,
  二月: 2,
  三月: 3,
  四月: 4,
  五月: 5,
  六月: 6,
  七月: 7,
  八月: 8,
  九月: 9,
  十月: 10,
  冬月: 11,
  腊月: 12,
}

const BUDDHIST_DAYS = [
  { month: 1, day: 1, name: '弥勒菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 1, day: 6, name: '定光佛圣诞', type: '佛菩萨圣诞' },
  { month: 2, day: 8, name: '释迦牟尼佛出家', type: '佛教纪念日' },
  { month: 2, day: 15, name: '释迦牟尼佛涅槃', type: '佛教纪念日' },
  { month: 2, day: 19, name: '观世音菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 2, day: 21, name: '普贤菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 3, day: 16, name: '准提菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 4, day: 4, name: '文殊菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 4, day: 8, name: '释迦牟尼佛圣诞', type: '浴佛节' },
  { month: 4, day: 15, name: '佛吉祥日', type: '佛教纪念日' },
  { month: 6, day: 3, name: '韦驮菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 6, day: 19, name: '观世音菩萨成道', type: '佛教纪念日' },
  { month: 7, day: 13, name: '大势至菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 7, day: 15, name: '佛欢喜日', type: '盂兰盆节' },
  { month: 7, day: 30, name: '地藏菩萨圣诞', type: '佛菩萨圣诞' },
  { month: 9, day: 19, name: '观世音菩萨出家', type: '佛教纪念日' },
  { month: 9, day: 30, name: '药师佛圣诞', type: '佛菩萨圣诞' },
  { month: 11, day: 17, name: '阿弥陀佛圣诞', type: '佛菩萨圣诞' },
  { month: 12, day: 8, name: '释迦牟尼佛成道', type: '腊八' },
]

const SIX_VEGETARIAN_DAYS = new Set([8, 14, 15, 23, 29, 30])
const TEN_VEGETARIAN_DAYS = new Set([1, 8, 14, 15, 18, 23, 24, 28, 29, 30])

function getLunarParts(date) {
  const formatter = new Intl.DateTimeFormat('zh-u-ca-chinese', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const parts = formatter.formatToParts(date)
  const monthText = parts.find((part) => part.type === 'month')?.value || ''
  const dayText = parts.find((part) => part.type === 'day')?.value || ''
  const yearText = parts.find((part) => part.type === 'relatedYear' || part.type === 'year')?.value || ''
  return {
    yearText,
    monthText,
    dayText,
    month: LUNAR_MONTH_MAP[monthText.replace('闰', '')] || 0,
    day: LUNAR_DAY_MAP[dayText] || Number(dayText) || 0,
    isLeapMonth: monthText.includes('闰'),
  }
}

function getBuddhistEvents(lunar) {
  const events = BUDDHIST_DAYS.filter((event) => event.month === lunar.month && event.day === lunar.day)
  if (SIX_VEGETARIAN_DAYS.has(lunar.day)) events.push({ name: '六斋日', type: '斋日' })
  if (TEN_VEGETARIAN_DAYS.has(lunar.day)) events.push({ name: '十斋日', type: '斋日' })
  if (lunar.day === 15) events.push({ name: '望日', type: '朔望' })
  if (lunar.day === 1) events.push({ name: '朔日', type: '朔望' })
  return events
}

function getCustomCalendarEvents(date, lunar) {
  const dateKey = formatDateKey(date)
  const events = [...(state.data.calendarEvents || []), ...(state.config.calendarEvents || [])]
  const seen = new Set()
  return events
    .filter((event) => {
      if (seen.has(event.id)) return false
      seen.add(event.id)
      return true
    })
    .filter((event) => {
      if (event.calendarType === 'lunar') {
        return Number(event.lunarMonth) === lunar.month && Number(event.lunarDay) === lunar.day
      }
      return formatServerDate(event.date) === dateKey
    })
    .map((event) => ({
      name: event.title,
      type: event.type || '寺院日程',
      custom: true,
      note: event.note || '',
    }))
}

function buildBuddhistCalendar(today) {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const start = new Date(monthStart)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const lunar = getLunarParts(date)
    const events = [...getBuddhistEvents(lunar), ...getCustomCalendarEvents(date, lunar)]
    return { date, lunar, events }
  })
  const todayKey = formatDateKey(today)
  const upcoming = days
    .filter((day) => day.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && day.events.length)
    .slice(0, 6)
  const todayLunar = getLunarParts(today)
  const todayEvents = [...getBuddhistEvents(todayLunar), ...getCustomCalendarEvents(today, todayLunar)]

  return `
    <div class="panel calendar-card">
      <div class="calendar-header">
        <div>
          <h2>万年历 / 佛教日历</h2>
          <p class="hint">${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 · 农历${todayLunar.isLeapMonth ? '闰' : ''}${todayLunar.monthText}${todayLunar.dayText}</p>
        </div>
        <div class="calendar-today">
          <strong>${todayEvents.length ? todayEvents.map((event) => event.name).join(' / ') : '今日无固定佛教节日'}</strong>
          <span>${todayEvents.length ? todayEvents.map((event) => event.type).join(' · ') : '可按寺院日程安排佛事'}</span>
          <button id="openCalendarBtn" class="primary" type="button">维护佛事日程</button>
        </div>
      </div>
      <div class="calendar-layout">
        <div class="calendar-grid">
          ${['一', '二', '三', '四', '五', '六', '日'].map((day) => `<div class="calendar-week">${day}</div>`).join('')}
          ${days.map((day) => {
            const inMonth = day.date.getMonth() === today.getMonth()
            const active = formatDateKey(day.date) === todayKey
            const marked = day.events.length > 0
            return `
              <div class="calendar-day ${inMonth ? '' : 'outside'} ${active ? 'today' : ''} ${marked ? 'marked' : ''}">
                <div class="solar">${day.date.getDate()}</div>
                <div class="lunar">${escapeHtml(day.lunar.dayText)}</div>
                ${marked ? `<div class="dot">${escapeHtml(day.events[0].name)}</div>` : ''}
              </div>
            `
          }).join('')}
        </div>
        <div class="upcoming-list">
          <h3>近期佛教日历</h3>
          ${upcoming.map((item) => `
            <div class="upcoming-item">
              <strong>${item.date.getMonth() + 1}/${item.date.getDate()}</strong>
              <span>${escapeHtml(item.lunar.monthText)}${escapeHtml(item.lunar.dayText)}</span>
              <p>${escapeHtml(item.events.map((event) => event.name).join(' / '))}</p>
            </div>
          `).join('') || '<p class="muted">近期无固定佛教节日</p>'}
        </div>
      </div>
    </div>
  `
}

function bindDashboardControls() {
  const button = $('#openCalendarBtn')
  if (button) button.onclick = () => setView('calendar')
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function formatServerDate(value) {
  if (!value) return ''
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(String(value))) return String(value)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function renderList(title, rows, mapRow) {
  content.innerHTML = `
    <div class="panel">
      <h2>${title}</h2>
      <p class="hint">显示最近同步数据；短时离线时继续可查看。</p>
    </div>
    <div class="table">
      ${rows.map((row) => `<div class="row">${mapRow(row).map(value => `<span>${escapeHtml(value)}</span>`).join('')}<span></span></div>`).join('') || '<p class="muted">暂无数据</p>'}
    </div>
  `
}

function renderPlaques() {
  const plaques = state.data.plaques || []
  const typeLabel = (t) => ({ LONGEVITY: '延生禄位', REBIRTH: '往生莲位', DELIVERANCE: '超度牌位' }[t] || t || '-')
  content.innerHTML = `
    <div class="panel">
      <h2>牌位管理</h2>
      <p class="hint">共 ${plaques.length} 条 · 可离线新增，联网后自动上传</p>
      <div class="actions">
        <button id="newPlaqueBtn" class="primary">+ 新建牌位</button>
      </div>
    </div>
    <div class="table" id="plaqueTable">
      ${plaques.map((item) => `
        <div class="row">
          <span>${escapeHtml(item.holderName || item.deceasedName || item.dedicationType || '-')}</span>
          <span>${escapeHtml(typeLabel(item.plaqueType))}</span>
          <span>${escapeHtml(item.phone || '-')}</span>
          <span>${escapeHtml(item.status || '-')}</span>
          <button data-plaque-delete="${escapeAttr(item.id)}">删除</button>
        </div>
      `).join('') || '<p class="muted">暂无牌位</p>'}
    </div>
    <div id="plaqueFormPanel" class="panel hidden">
      <h3>新建牌位</h3>
      <div class="grid">
        <label>牌位类型
          <select id="plaqueType">
            <option value="LONGEVITY">延生禄位</option>
            <option value="REBIRTH">往生莲位</option>
            <option value="DELIVERANCE">超度牌位</option>
          </select>
        </label>
        <label>持名者/亡者姓名<input id="plaqueName" placeholder="牌位主体姓名" /></label>
        <label>阳上（供奉人）<input id="plaqueYangShang" placeholder="供奉人姓名" /></label>
        <label>电话<input id="plaquePhone" placeholder="联系电话" /></label>
        <label>地址<input id="plaqueAddress" placeholder="地址" /></label>
      </div>
      <div class="actions">
        <button id="savePlaqueBtn" class="primary">保存牌位</button>
        <button id="cancelPlaqueBtn">取消</button>
      </div>
      <pre id="plaqueOutput" class="hint output"></pre>
    </div>
  `
  $('#newPlaqueBtn').onclick = () => {
    $('#plaqueFormPanel').classList.remove('hidden')
    $('#newPlaqueBtn').style.display = 'none'
  }
  $('#cancelPlaqueBtn').onclick = () => {
    $('#plaqueFormPanel').classList.add('hidden')
    $('#newPlaqueBtn').style.display = ''
    $('#plaqueOutput').textContent = ''
  }
  $('#savePlaqueBtn').onclick = async () => {
    const plaqueType = $('#plaqueType').value
    const name = $('#plaqueName').value.trim()
    const yangShang = $('#plaqueYangShang').value.trim()
    if (!name) { $('#plaqueOutput').textContent = '请输入持名者/亡者姓名'; return }
    const payload = {
      plaqueType,
      holderName: plaqueType === 'LONGEVITY' ? name : '',
      deceasedName: plaqueType !== 'LONGEVITY' ? name : '',
      yangShang: yangShang || '',
      phone: $('#plaquePhone').value.trim(),
      address: $('#plaqueAddress').value.trim(),
      status: 'ACTIVE',
    }
    const result = await offlineAwareSave('plaque', '/api/plaques', 'POST', payload)
    if (result._offline) {
      $('#plaqueOutput').textContent = '已离线保存，联网后自动上传'
      state.data.plaques = [result, ...state.data.plaques]
      await saveConfig({ recentData: state.data })
    } else {
      $('#plaqueOutput').textContent = '已保存到服务器'
      state.data.plaques = [result, ...state.data.plaques]
      await saveConfig({ recentData: state.data })
    }
    $('#plaqueFormPanel').classList.add('hidden')
    $('#newPlaqueBtn').style.display = ''
    render()
  }

  document.querySelectorAll('[data-plaque-delete]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.plaqueDelete
      if (!confirm('确定删除该牌位？')) return
      if (!String(id).startsWith('local_')) {
        await apiRequest(`/api/plaques/${id}`, { method: 'DELETE' }).catch(() => null)
      }
      state.data.plaques = (state.data.plaques || []).filter((item) => item.id !== id)
      await saveConfig({ recentData: state.data })
      render()
    }
  })
}

function renderDevotees() {
  const devotees = state.data.devotees || []
  content.innerHTML = `
    <div class="panel">
      <h2>信众管理</h2>
      <p class="hint">共 ${devotees.length} 条 · 可离线新增，联网后自动上传</p>
      <div class="actions">
        <button id="newDevoteeBtn" class="primary">+ 新建信众</button>
      </div>
    </div>
    <div class="table">
      ${devotees.map((item) => `
        <div class="row">
          <span>${escapeHtml(item.name || '-')}</span>
          <span>${escapeHtml(item.phone || '-')}</span>
          <span>${escapeHtml(item.address || '-')}</span>
          <span>${item.createdAt ? item.createdAt.slice(0, 10) : '-'}</span>
          <button data-devotee-delete="${escapeAttr(item.id)}">删除</button>
        </div>
      `).join('') || '<p class="muted">暂无信众</p>'}
    </div>
    <div id="devoteeFormPanel" class="panel hidden">
      <h3>新建信众</h3>
      <div class="grid">
        <label>姓名<input id="devoteeName" placeholder="信众姓名" /></label>
        <label>电话<input id="devoteePhone" placeholder="联系电话" /></label>
        <label>地址<input id="devoteeAddress" placeholder="地址" /></label>
        <label>微信<input id="devoteeWechat" placeholder="微信号" /></label>
      </div>
      <div class="actions">
        <button id="saveDevoteeBtn" class="primary">保存信众</button>
        <button id="cancelDevoteeBtn">取消</button>
      </div>
      <pre id="devoteeOutput" class="hint output"></pre>
    </div>
  `
  $('#newDevoteeBtn').onclick = () => {
    $('#devoteeFormPanel').classList.remove('hidden')
    $('#newDevoteeBtn').style.display = 'none'
  }
  $('#cancelDevoteeBtn').onclick = () => {
    $('#devoteeFormPanel').classList.add('hidden')
    $('#newDevoteeBtn').style.display = ''
    $('#devoteeOutput').textContent = ''
  }
  $('#saveDevoteeBtn').onclick = async () => {
    const name = $('#devoteeName').value.trim()
    if (!name) { $('#devoteeOutput').textContent = '请输入姓名'; return }
    const payload = {
      name,
      phone: $('#devoteePhone').value.trim(),
      address: $('#devoteeAddress').value.trim(),
      wechat: $('#devoteeWechat').value.trim(),
      tags: [],
      totalDonation: 0,
    }
    const result = await offlineAwareSave('devotee', '/api/devotees', 'POST', payload)
    if (result._offline) {
      $('#devoteeOutput').textContent = '已离线保存，联网后自动上传'
      state.data.devotees = [result, ...state.data.devotees]
      await saveConfig({ recentData: state.data })
    } else {
      $('#devoteeOutput').textContent = '已保存到服务器'
      state.data.devotees = [result, ...state.data.devotees]
      await saveConfig({ recentData: state.data })
    }
    $('#devoteeFormPanel').classList.add('hidden')
    $('#newDevoteeBtn').style.display = ''
    render()
  }

  document.querySelectorAll('[data-devotee-delete]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.devoteeDelete
      if (!confirm('确定删除该信众？')) return
      if (!String(id).startsWith('local_')) {
        await apiRequest(`/api/devotees/${id}`, { method: 'DELETE' }).catch(() => null)
      }
      state.data.devotees = (state.data.devotees || []).filter((item) => item.id !== id)
      await saveConfig({ recentData: state.data })
      render()
    }
  })
}

function renderPrint() {
  const client = state.config.printClient
  content.innerHTML = `
    <div class="panel">
      <h2>本地打印客户端</h2>
      <p class="hint">${client ? `已注册：${client.name} / ${client.clientCode}` : '尚未注册本机打印客户端'}</p>
      <div class="grid">
        <label>客户端名称<input id="clientName" value="${escapeAttr(client?.name || '寺院前台电脑')}" /></label>
        <label>默认打印机<select id="printerSelect"></select></label>
        <label>操作<button id="registerClientBtn">注册/更新客户端</button></label>
      </div>
      <button id="fetchJobBtn" class="primary">领取下一条打印任务</button>
    </div>
    <div class="table">
      ${(state.config.cachedJobs || []).map((job) => `
        <div class="row">
          <span>${escapeHtml(job.jobNo || job.id)}</span>
          <span>${escapeHtml(job.status || '-')}</span>
          <span>${job.items?.length || 0} 项</span>
          <button data-print-job="${job.id}">打印预览</button>
        </div>
      `).join('') || '<p class="muted">暂无已领取任务</p>'}
    </div>
  `
  bindPrintControls()
}

async function bindPrintControls() {
  const printers = await window.templeDesktop.listPrinters().catch(() => [])
  const select = $('#printerSelect')
  select.innerHTML = printers.map((printer) => `<option value="${escapeAttr(printer.name)}">${escapeHtml(printer.name)}</option>`).join('')
  select.value = state.config.defaultPrinter || printers[0]?.name || ''

  $('#registerClientBtn').onclick = async () => {
    const name = $('#clientName').value.trim()
    const defaultPrinter = $('#printerSelect').value
    if (!state.config.printClient) {
      const client = await apiRequest('/api/local-print/clients/register', {
        method: 'POST',
        body: JSON.stringify({ name, machineName: navigator.userAgent, defaultPrinter }),
      })
      await saveConfig({ printClient: client.data || client, defaultPrinter })
    } else {
      await apiRequest(`/api/local-print/clients/${state.config.printClient.id}/heartbeat`, {
        method: 'POST',
        body: JSON.stringify({ machineToken: state.config.printClient.machineToken, status: 'ONLINE', defaultPrinter }),
      })
      await saveConfig({ defaultPrinter, printClient: { ...state.config.printClient, name, defaultPrinter } })
    }
    render()
  }

  $('#fetchJobBtn').onclick = fetchNextPrintJob
  document.querySelectorAll('[data-print-job]').forEach((button) => {
    button.onclick = () => printCachedJob(button.dataset.printJob)
  })
}

function renderSettings() {
  content.innerHTML = `
    <div class="panel">
      <h2>连接设置</h2>
      <div class="grid">
        <label>服务器地址<input id="settingsServerUrl" value="${escapeAttr(state.config.serverUrl || '')}" /></label>
        <label>默认打印机<select id="settingsPrinter"></select></label>
        <label>操作<button id="saveSettingsBtn">保存设置</button></label>
      </div>
      <div class="actions">
        <button id="testServerBtn" class="primary">检测服务器</button>
        <button id="clearCacheBtn">清除本地缓存</button>
        <button id="openSetupBtn">打开安装助手</button>
      </div>
      <pre id="settingsOutput" class="hint output"></pre>
    </div>
  `
  bindSettingsControls()
}

function renderCalendarSettings() {
  const events = [...(state.data.calendarEvents || []), ...(state.config.calendarEvents || [])]
  content.innerHTML = `
    <div class="panel">
      <h2>佛事日程</h2>
      <p class="hint">维护寺院佛事、法会、纪念日。联网时保存到服务器；离线失败时保存在本机。</p>
      <div class="grid">
        <label>事项名称<input id="calendarTitle" placeholder="例如：梁皇法会" /></label>
        <label>类型
          <select id="calendarType">
            <option value="寺院日程">寺院日程</option>
            <option value="法会">法会</option>
            <option value="纪念日">纪念日</option>
            <option value="斋日">斋日</option>
          </select>
        </label>
        <label>日期类型
          <select id="calendarCalendarType">
            <option value="solar">公历</option>
            <option value="lunar">农历</option>
          </select>
        </label>
        <label>公历日期<input id="calendarDate" type="date" /></label>
        <label>农历月份<input id="calendarLunarMonth" type="number" min="1" max="12" placeholder="1-12" /></label>
        <label>农历日期<input id="calendarLunarDay" type="number" min="1" max="30" placeholder="1-30" /></label>
      </div>
      <label>备注<input id="calendarNote" placeholder="可填写地点、负责人、提醒说明" /></label>
      <div class="actions">
        <button id="addCalendarEventBtn" class="primary">添加日程</button>
        <button id="clearCalendarEventsBtn">清空本地日程</button>
      </div>
      <div class="grid">
        <label>模板 ID<input id="reminderTemplateId" placeholder="公众号模板消息 ID，可暂留空" /></label>
        <label>提醒标题<input id="reminderTitle" placeholder="例如：法会开始提醒" /></label>
        <label>接收 openId<textarea id="reminderOpenIds" rows="3" placeholder="多个 openId 可换行或逗号分隔"></textarea></label>
      </div>
      <pre id="calendarOutput" class="hint output"></pre>
    </div>
    <div class="table">
      ${events.map((event) => `
        <div class="row">
          <span>${escapeHtml(event.title)}</span>
          <span>${escapeHtml(event.type || '-')}</span>
          <span>${event.calendarType === 'lunar' ? `农历 ${event.lunarMonth}/${event.lunarDay}` : escapeHtml(formatServerDate(event.date) || '-')}</span>
          <span class="actions">
            <button data-reminder-draft="${escapeAttr(event.id)}">生成提醒草稿</button>
            <button data-calendar-delete="${escapeAttr(event.id)}">删除</button>
          </span>
        </div>
      `).join('') || '<p class="muted">暂无本地佛事日程</p>'}
    </div>
  `
  bindCalendarSettingsControls()
}

function bindCalendarSettingsControls() {
  const dateInput = $('#calendarDate')
  dateInput.value = new Date().toISOString().slice(0, 10)

  $('#addCalendarEventBtn').onclick = async () => {
    const title = $('#calendarTitle').value.trim()
    const calendarType = $('#calendarCalendarType').value
    const event = {
      id: `local_${Date.now()}`,
      title,
      type: $('#calendarType').value,
      calendarType,
      date: $('#calendarDate').value,
      lunarMonth: Number($('#calendarLunarMonth').value),
      lunarDay: Number($('#calendarLunarDay').value),
      note: $('#calendarNote').value.trim(),
    }
    if (!event.title) {
      alert('请填写事项名称')
      return
    }
    if (calendarType === 'solar' && !event.date) {
      alert('请选择公历日期')
      return
    }
    if (calendarType === 'lunar' && (!event.lunarMonth || !event.lunarDay)) {
      alert('请填写农历月份和日期')
      return
    }
    try {
      const saved = await apiRequest('/api/calendar-events', {
        method: 'POST',
        body: JSON.stringify(event),
      })
      state.data.calendarEvents = [saved.data || saved, ...(state.data.calendarEvents || [])]
      await saveConfig({ recentData: state.data })
    } catch {
      await saveConfig({ calendarEvents: [event, ...(state.config.calendarEvents || [])] })
    }
    render()
  }

  $('#clearCalendarEventsBtn').onclick = async () => {
    if (!confirm('确定清空本地佛事日程？')) return
    await saveConfig({ calendarEvents: [] })
    render()
  }

  document.querySelectorAll('[data-calendar-delete]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.calendarDelete
      if (!String(id).startsWith('local_')) {
        await apiRequest(`/api/calendar-events/${id}`, { method: 'DELETE' }).catch(() => null)
        state.data.calendarEvents = (state.data.calendarEvents || []).filter((event) => event.id !== id)
        await saveConfig({ recentData: state.data })
      } else {
        await saveConfig({ calendarEvents: (state.config.calendarEvents || []).filter((event) => event.id !== id) })
      }
      render()
    }
  })

  document.querySelectorAll('[data-reminder-draft]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.reminderDraft
      if (String(id).startsWith('local_')) {
        $('#calendarOutput').textContent = '本地离线日程不能生成服务器公众号提醒草稿，请先联网保存到服务器。'
        return
      }
      try {
        const result = await apiRequest(`/api/calendar-events/${id}/reminder-drafts`, {
          method: 'POST',
          body: JSON.stringify({
            templateId: $('#reminderTemplateId').value.trim(),
            title: $('#reminderTitle').value.trim(),
            openIds: $('#reminderOpenIds').value,
          }),
        })
        $('#calendarOutput').textContent = `已生成 ${result.data?.count || result.count || 0} 条公众号模板消息草稿，状态为 PENDING，需人工确认后发送。`
      } catch (error) {
        $('#calendarOutput').textContent = `生成失败：${error.message}`
      }
    }
  })
}

async function bindSettingsControls() {
  const printers = await window.templeDesktop.listPrinters().catch(() => [])
  const printerSelect = $('#settingsPrinter')
  printerSelect.innerHTML = [
    `<option value="">不指定</option>`,
    ...printers.map((printer) => `<option value="${escapeAttr(printer.name)}">${escapeHtml(printer.name)}</option>`),
  ].join('')
  printerSelect.value = state.config.defaultPrinter || ''

  $('#saveSettingsBtn').onclick = async () => {
    await saveConfig({
      serverUrl: normalizeServerUrl($('#settingsServerUrl').value),
      defaultPrinter: $('#settingsPrinter').value,
    })
    setStatus(`已配置服务器：${state.config.serverUrl}`)
    $('#settingsOutput').textContent = '设置已保存。'
  }

  $('#testServerBtn').onclick = async () => {
    try {
      const serverUrl = normalizeServerUrl($('#settingsServerUrl').value)
      const result = await window.templeDesktop.checkServer(serverUrl)
      $('#settingsOutput').textContent = `服务器连接正常：HTTP ${result.statusCode}\n${JSON.stringify(result.data || {}, null, 2)}`
    } catch (error) {
      $('#settingsOutput').textContent = `服务器检测失败：${error.message}`
    }
  }

  $('#clearCacheBtn').onclick = async () => {
    state.data = { requests: [], plaques: [], devotees: [], jobs: [], calendarEvents: [] }
    state.syncMarkers = null
    await saveConfig({ recentData: state.data, cachedJobs: [], pendingReports: [] })
    await window.templeDesktop.setCache('syncMarkers', null)
    $('#settingsOutput').textContent = '本地缓存已清除，登录信息和服务器地址已保留。'
    render()
  }

  $('#openSetupBtn').onclick = () => {
    window.templeDesktop.openSetup()
  }
}

function renderDiagnostics() {
  const pendingReports = state.config.pendingReports || []
  const cachedJobs = state.config.cachedJobs || []
  content.innerHTML = `
    <div class="panel">
      <h2>连接诊断</h2>
      <div class="cards">
        <div class="card"><span>服务器</span><strong>${escapeHtml(state.config.serverUrl || '-')}</strong></div>
        <div class="card"><span>登录状态</span><strong>${state.token ? '已登录' : '未登录'}</strong></div>
        <div class="card"><span>已缓存打印</span><strong>${cachedJobs.length}</strong></div>
        <div class="card"><span>待回传</span><strong>${pendingReports.length}</strong></div>
      </div>
      <div class="actions">
        <button id="diagHealthBtn" class="primary">检测 /api/health</button>
        <button id="diagSyncBtn">增量同步</button>
        <button id="diagFullSyncBtn">全量同步</button>
        <button id="diagSetupBtn">重新配置</button>
      </div>
      <pre id="diagOutput" class="hint output"></pre>
    </div>
  `

  $('#diagHealthBtn').onclick = async () => {
    try {
      const result = await window.templeDesktop.checkServer(state.config.serverUrl)
      $('#diagOutput').textContent = `连接正常：HTTP ${result.statusCode}\n${JSON.stringify(result.data || {}, null, 2)}`
    } catch (error) {
      $('#diagOutput').textContent = `连接失败：${error.message}`
    }
  }
  $('#diagSyncBtn').onclick = () => syncData(false).catch((error) => {
    $('#diagOutput').textContent = `同步失败：${error.message}`
  })
  $('#diagFullSyncBtn').onclick = () => syncData(true).catch((error) => {
    $('#diagOutput').textContent = `全量同步失败：${error.message}`
  })
  $('#diagSetupBtn').onclick = () => window.templeDesktop.openSetup()
}

async function login() {
  const serverUrl = normalizeServerUrl($('#serverUrl').value)
  const username = $('#username').value.trim()
  const password = $('#password').value
  await saveConfig({ serverUrl })
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  state.token = result.data?.token || result.token
  state.user = result.data?.user || result.user
  await saveConfig({ auth: { token: state.token, user: state.user } })
  setStatus(`已连接：${serverUrl}`)
  await flushSyncQueue()
  await syncData(true)
}

async function syncData(fullSync = false) {
  if (!state.token) return

  const now = new Date().toISOString()
  const markers = fullSync ? {} : (state.syncMarkers || {})
  const since = (key) => markers[key] ? `&updatedSince=${encodeURIComponent(markers[key])}` : ''

  const [requests, plaques, devotees, jobs, calendarEvents] = await Promise.all([
    apiRequest(`/api/registration/requests?status=PENDING${since('requests')}`).catch(() => state.data.requests),
    apiRequest(`/api/plaques?${since('plaques')}`).catch(() => state.data.plaques),
    apiRequest(`/api/devotees?${since('devotees')}`).catch(() => state.data.devotees),
    apiRequest(`/api/print-jobs?status=PENDING${since('jobs')}`).catch(() => state.data.jobs),
    apiRequest(`/api/calendar-events?${since('calendarEvents')}`).catch(() => state.data.calendarEvents),
  ])

  const newRequests = Array.isArray(requests?.list) ? requests.list : (Array.isArray(requests) ? requests : requests?.data || [])
  const newPlaques = Array.isArray(plaques) ? plaques : []
  const newDevotees = Array.isArray(devotees) ? devotees : []
  const newJobs = Array.isArray(jobs) ? jobs : []
  const newCalendarEvents = Array.isArray(calendarEvents) ? calendarEvents : []

  if (fullSync) {
    state.data = {
      requests: newRequests,
      plaques: newPlaques,
      devotees: newDevotees,
      jobs: newJobs,
      calendarEvents: newCalendarEvents,
    }
  } else {
    // merge: upsert by id, keep local items that don't exist on server
    const mergeById = (existing, incoming) => {
      const map = new Map(existing.map(item => [item.id, item]))
      for (const item of incoming) map.set(item.id, item)
      return [...map.values()]
    }
    state.data.requests = mergeById(state.data.requests, newRequests)
    state.data.plaques = mergeById(state.data.plaques, newPlaques)
    state.data.devotees = mergeById(state.data.devotees, newDevotees)
    state.data.jobs = mergeById(state.data.jobs, newJobs)
    state.data.calendarEvents = mergeById(state.data.calendarEvents, newCalendarEvents)
  }

  state.syncMarkers = { plaques: now, devotees: now, requests: now, jobs: now, calendarEvents: now }
  await saveConfig({ recentData: state.data })
  await window.templeDesktop.setCache('syncMarkers', state.syncMarkers)

  // persist to local SQLite for offline access
  const persistRows = (entityType, rows) => {
    if (!rows || !rows.length) return
    return window.templeDesktop.upsertLocalRows(entityType, rows).catch(() => {})
  }
  await Promise.all([
    persistRows('plaque', state.data.plaques),
    persistRows('devotee', state.data.devotees),
    persistRows('registration_request', state.data.requests),
    persistRows('print_job', state.data.jobs),
    persistRows('calendar_event', state.data.calendarEvents),
  ])

  setStatus(`已同步：${new Date().toLocaleString()}`)
  render()
}

async function flushSyncQueue() {
  try {
    const queue = await window.templeDesktop.getSyncQueue()
    let flushed = 0
    for (const item of queue) {
      if (item.status !== 'PENDING') continue
      try {
        await apiRequest(item.endpoint, {
          method: item.method,
          body: item.payload,
        })
        flushed++
      } catch {
        break // stop on first failure to preserve order
      }
    }
    if (flushed) setStatus(`已上传 ${flushed} 条离线操作`)
  } catch {
    // no-op if local DB not available
  }
}

async function offlineAwareSave(entityType, apiPath, method, payload) {
  try {
    const result = await apiRequest(apiPath, { method, body: JSON.stringify(payload) })
    return result.data || result
  } catch {
    await window.templeDesktop.offlineSave({
      entityType,
      operation: method === 'POST' ? 'CREATE' : 'UPDATE',
      endpoint: apiPath,
      method,
      payload,
    }).catch(() => {})
    return { ...payload, id: `local_${Date.now()}`, _offline: true }
  }
}

async function fetchNextPrintJob() {
  const client = state.config.printClient
  if (!client) throw new Error('请先注册本机打印客户端')
  const job = await apiRequest(`/api/local-print/clients/${client.id}/jobs/next?machineToken=${encodeURIComponent(client.machineToken)}`)
  if (!job) {
    alert('暂无待打印任务')
    return
  }
  const cachedJobs = [job, ...(state.config.cachedJobs || []).filter((item) => item.id !== job.id)].slice(0, 20)
  await saveConfig({ cachedJobs })
  render()
}

async function printCachedJob(jobId) {
  const job = (state.config.cachedJobs || []).find((item) => item.id === jobId)
  if (!job) return
  const html = buildPrintHtml(job)
  const result = await window.templeDesktop.printHtml({
    html,
    deviceName: state.config.defaultPrinter || '',
    silent: false,
  })
  const reportStatus = result.success ? 'COMPLETED' : 'FAILED'
  for (const item of job.items || []) {
    await reportPrintItem(job, item, reportStatus, result.failureReason)
  }
  await fetchNextPrintJob().catch(() => render())
}

async function reportPrintItem(job, item, status, errorMessage) {
  const client = state.config.printClient
  const report = {
    url: `/api/local-print/jobs/${job.id}/items/${item.id}/report`,
    body: { machineToken: client.machineToken, status, errorMessage },
  }
  try {
    await apiRequest(report.url, {
      method: 'POST',
      body: JSON.stringify(report.body),
    })
  } catch {
    const pendingReports = [...(state.config.pendingReports || []), report]
    await saveConfig({ pendingReports })
  }
}

function buildPrintHtml(job) {
  const items = job.items || []
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: "Microsoft YaHei", sans-serif; margin: 24px; }
          .page { page-break-after: always; min-height: 90vh; display: grid; place-items: center; border: 1px solid #ddd; }
          h1 { writing-mode: vertical-rl; font-size: 42px; letter-spacing: 8px; }
          p { color: #666; }
        </style>
      </head>
      <body>
        ${items.map((item) => {
          const payload = item.payload || {}
          const title = item.subject || payload.holderName || payload.deceasedName || payload.dedicationType || '牌位'
          return `<section class="page"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(job.templateName || job.jobNo || '')}</p></div></section>`
        }).join('')}
      </body>
    </html>
  `
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

async function init() {
  state.config = await window.templeDesktop.getConfig()
  state.token = state.config.auth?.token || ''
  state.user = state.config.auth?.user || null
  state.data = state.config.recentData || state.data
  state.syncMarkers = await window.templeDesktop.getCache('syncMarkers') || null

  $('#serverUrl').value = state.config.serverUrl || ''
  $('#loginBtn').onclick = () => login().catch((error) => alert(error.message))
  $('#syncBtn').onclick = () => syncData().catch((error) => {
    setStatus(`同步失败，使用本地缓存：${error.message}`)
    render()
  })
  $('#webAdminBtn').onclick = () => window.templeDesktop.openWebAdmin?.().catch((error) => alert(error.message))
  $('#setupBtn').onclick = () => window.templeDesktop.openSetup()
  $('#logoutBtn').onclick = async () => {
    state.token = ''
    state.user = null
    await saveConfig({ auth: null })
    render()
  }

  document.querySelectorAll('.nav').forEach((button) => {
    button.onclick = () => setView(button.dataset.view)
  })

  if (state.config.serverUrl) setStatus(`服务器：${state.config.serverUrl}`)
  render()
  if (state.token) {
    syncData().catch(async (error) => {
      setStatus(`离线模式：${error.message}`)
      // fallback: load from local SQLite
      try {
        const [plaques, devotees, requests, jobs, calendarEvents] = await Promise.all([
          window.templeDesktop.listLocalRows('plaque'),
          window.templeDesktop.listLocalRows('devotee'),
          window.templeDesktop.listLocalRows('registration_request'),
          window.templeDesktop.listLocalRows('print_job'),
          window.templeDesktop.listLocalRows('calendar_event'),
        ])
        if (plaques.length || devotees.length) {
          state.data = {
            requests: requests || [],
            plaques: plaques || [],
            devotees: devotees || [],
            jobs: jobs || [],
            calendarEvents: calendarEvents || [],
          }
          setStatus(`离线模式：已加载本地数据（${state.data.plaques.length} 牌位, ${state.data.devotees.length} 信众）`)
        }
      } catch {
        // both server and local DB unavailable
      }
      render()
    })
  }
}

init()
