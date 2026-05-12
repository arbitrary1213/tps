function normalizeServerUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function $(selector) {
  return document.querySelector(selector)
}

function setMode(mode) {
  const connect = mode === 'connect'
  $('#connectModeBtn').classList.toggle('active', connect)
  $('#deployModeBtn').classList.toggle('active', !connect)
  $('#connectPanel').classList.toggle('hidden', !connect)
  $('#deployPanel').classList.toggle('hidden', connect)
  $('#message').textContent = ''
}

async function checkHealth(serverUrl) {
  return window.templeDesktop.checkServer(serverUrl)
}

function buildDeployChecklist() {
  const values = {
    serverHost: $('#serverHost').value.trim(),
    sshPort: $('#sshPort').value.trim() || '22',
    sshUsername: $('#sshUsername').value.trim(),
    domain: $('#domain').value.trim(),
    adminUsername: $('#adminUsername').value.trim(),
    hasSshPassword: Boolean($('#sshPassword').value),
    hasAdminPassword: Boolean($('#adminPassword').value),
    hasDatabasePassword: Boolean($('#databasePassword').value),
  }

  const missing = Object.entries(values)
    .filter(([key, value]) => key !== 'hasSshPassword' && key !== 'hasAdminPassword' && key !== 'hasDatabasePassword' && !value)
    .map(([key]) => key)

  if (!values.hasSshPassword) missing.push('sshPassword')
  if (!values.hasAdminPassword) missing.push('adminPassword')
  if (!values.hasDatabasePassword) missing.push('databasePassword')

  if (missing.length) {
    return `请补充以下字段：${missing.join(', ')}`
  }

  return [
    '部署检查清单已生成：',
    `- 目标服务器：${values.serverHost}:${values.sshPort}`,
    `- SSH 用户：${values.sshUsername}`,
    `- 绑定域名：${values.domain}`,
    `- 初始管理员：${values.adminUsername}`,
    '- 支持系统：Ubuntu 22.04/24.04 x86_64',
    '- 部署内容：backend / frontend / print-service / docker / 初始化脚本',
    '- 安全策略：SSH 密码仅用于部署过程，不保存到本地配置',
    '',
    '下一阶段会在此处接入 SSH 自动检测、上传发布包、执行部署和 /api/health 验证。',
  ].join('\n')
}

async function init() {
  const config = await window.templeDesktop.getConfig()
  $('#serverUrl').value = config.serverUrl || 'https://xiandingsi.cn'

  $('#connectModeBtn').onclick = () => setMode('connect')
  $('#deployModeBtn').onclick = () => setMode('deploy')

  $('#saveBtn').onclick = async () => {
    try {
      const serverUrl = normalizeServerUrl($('#serverUrl').value)
      if (!/^https?:\/\//.test(serverUrl)) {
        $('#message').textContent = '服务器地址必须以 http:// 或 https:// 开头'
        return
      }
      $('#message').textContent = '正在检测服务器...'
      const result = await checkHealth(serverUrl)
      $('#message').textContent = `服务器正常（HTTP ${result.statusCode}），正在启动本地工作台...`
      await window.templeDesktop.setConfig({ serverUrl })
      await window.templeDesktop.openAdmin()
    } catch (error) {
      $('#message').textContent = [
        '服务器连接失败：',
        error.message,
        '',
        '请检查：',
        '- 地址是否包含 http:// 或 https://',
        '- 服务器 /api/health 是否可访问',
        '- 域名证书是否正常',
        '- 本机网络是否可访问服务器',
      ].join('\n')
    }
  }

  $('#openBtn').onclick = async () => {
    const serverUrl = normalizeServerUrl($('#serverUrl').value)
    if (serverUrl) await window.templeDesktop.setConfig({ serverUrl })
    await window.templeDesktop.openAdmin()
  }

  $('#clearBtn').onclick = async () => {
    await window.templeDesktop.clearConfig()
    $('#serverUrl').value = ''
    $('#message').textContent = '本地配置已清除。'
  }

  $('#deployCheckBtn').onclick = () => {
    $('#message').textContent = buildDeployChecklist()
  }
}

init().catch((error) => {
  $('#message').textContent = error.message
})
