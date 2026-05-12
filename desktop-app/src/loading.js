const statusLog = document.querySelector('#statusLog')
const subtitle = document.querySelector('#subtitle')
const progressBar = document.querySelector('#progressBar')
const lines = []

function setStatus(payload) {
  const message = typeof payload === 'string' ? payload : payload?.message || ''
  const level = typeof payload === 'string' ? 'info' : payload?.level || 'info'
  const progress = typeof payload === 'string' ? undefined : payload?.progress
  if (!message) return

  subtitle.textContent = message
  lines.push(`${level === 'error' ? '错误' : '状态'}：${message}`)
  statusLog.textContent = lines.slice(-8).join('\n')
  if (typeof progress === 'number') {
    progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`
  }
}

document.querySelector('#retryBtn').onclick = () => {
  lines.length = 0
  setStatus({ message: '正在重新启动工作台...', progress: 10 })
  window.templeDesktop.reloadAdmin()
}

document.querySelector('#setupBtn').onclick = () => {
  window.templeDesktop.openSetup()
}

window.templeDesktop.onStatus(setStatus)

window.templeDesktop.getAppInfo().then((info) => {
  document.title = `${info.name} ${info.version}`
})
