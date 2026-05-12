const http = require('http')
const https = require('https')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

function createFrontendRuntime({ session, processRef, projectRoot, frontendPort, sendStatus }) {
  let apiRedirectInstalled = false
  let frontendProcess = null

  function requestJson(url, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http
      const req = client.get(url, { timeout: timeoutMs }, (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          let json = null
          try {
            json = body ? JSON.parse(body) : null
          } catch {
            json = null
          }
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
            resolve({ statusCode: res.statusCode, data: json, body })
            return
          }
          reject(new Error(`服务器返回 ${res.statusCode || '未知状态'}`))
        })
      })
      req.on('timeout', () => {
        req.destroy(new Error('服务器连接超时'))
      })
      req.on('error', reject)
    })
  }

  async function checkServerHealth(serverUrl) {
    const normalized = String(serverUrl || '').trim().replace(/\/+$/, '')
    if (!/^https?:\/\//.test(normalized)) {
      throw new Error('服务器地址必须以 http:// 或 https:// 开头')
    }
    const result = await requestJson(`${normalized}/api/health`)
    if (result.statusCode >= 400) {
      throw new Error(`服务器健康检查失败：${result.statusCode}`)
    }
    return { serverUrl: normalized, statusCode: result.statusCode, data: result.data }
  }

  function waitForFrontend(url, timeoutMs = 30000) {
    const startedAt = Date.now()
    return new Promise((resolve, reject) => {
      const tick = () => {
        const req = http.get(url, (res) => {
          res.resume()
          if (res.statusCode && res.statusCode < 500) {
            resolve(true)
            return
          }
          retry()
        })
        const retry = () => {
          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error(`Frontend did not start within ${timeoutMs}ms`))
            return
          }
          setTimeout(tick, 500)
        }
        req.on('error', () => {
          retry()
        })
        req.setTimeout(1000, () => {
          req.destroy()
        })
      }
      tick()
    })
  }

  async function installApiRedirect(serverUrl) {
    if (apiRedirectInstalled) return
    const localOrigin = `http://127.0.0.1:${frontendPort}`
    const remoteOrigin = String(serverUrl || '').replace(/\/+$/, '')

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      if (!remoteOrigin || !details.url.startsWith(localOrigin)) {
        callback({ requestHeaders: details.requestHeaders })
        return
      }

      const url = new URL(details.url)
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/export/') || url.pathname.startsWith('/search/')) {
        details.requestHeaders['x-temple-api-base'] = remoteOrigin
      }

      callback({ requestHeaders: details.requestHeaders })
    })

    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      if (!remoteOrigin || !details.url.startsWith(localOrigin)) {
        callback({})
        return
      }

      const url = new URL(details.url)
      if (!url.pathname.startsWith('/wechat/')) {
        callback({})
        return
      }

      callback({ redirectURL: `${remoteOrigin}${url.pathname}${url.search}` })
    })

    apiRedirectInstalled = true
  }

  async function startFrontend(serverUrl) {
    if (frontendProcess) return

    try {
      await waitForFrontend(`http://127.0.0.1:${frontendPort}/login`, 1200)
      sendStatus('已连接本地前端服务', 70)
      return
    } catch {
      // No existing local frontend is available; start our managed process below.
    }

    sendStatus('正在启动本地前端服务...', 35)
    const frontendDir = path.join(projectRoot, 'frontend')
    const standaloneDir = path.join(frontendDir, '.next', 'standalone')
    const standaloneServer = path.join(standaloneDir, 'server.js')
    const useStandalone = fs.existsSync(standaloneServer)

    frontendProcess = spawn(
      processRef.execPath,
      useStandalone
        ? [standaloneServer]
        : [path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-p', String(frontendPort), '-H', '127.0.0.1'],
      {
        cwd: useStandalone ? standaloneDir : frontendDir,
        env: {
          ...processRef.env,
          PORT: String(frontendPort),
          HOSTNAME: '127.0.0.1',
          NEXT_PUBLIC_API_BASE: serverUrl,
          API_BASE: serverUrl,
          BROWSER: 'none',
        },
        stdio: 'pipe',
        windowsHide: true,
      }
    )

    frontendProcess.stdout.on('data', (chunk) => {
      console.log(`[frontend] ${chunk}`)
    })
    frontendProcess.stderr.on('data', (chunk) => {
      console.error(`[frontend] ${chunk}`)
    })
    frontendProcess.on('exit', (code) => {
      console.log(`frontend exited with code ${code}`)
      frontendProcess = null
    })

    await waitForFrontend(`http://127.0.0.1:${frontendPort}/login`, 45000)
    sendStatus('本地前端服务已就绪', 70)
  }

  function stopFrontend() {
    if (frontendProcess) {
      frontendProcess.kill()
      frontendProcess = null
    }
  }

  return {
    checkServerHealth,
    installApiRedirect,
    startFrontend,
    stopFrontend,
  }
}

module.exports = {
  createFrontendRuntime,
}
