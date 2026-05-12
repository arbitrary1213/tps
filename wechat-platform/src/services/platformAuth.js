function createPlatformAuthService({
  COMPONENT_APP_ID,
  COMPONENT_SECRET,
  createId,
  persistAuthorizer,
  persistEvent,
  persistToken,
  postWechat,
  saveStore,
  store,
}) {
  async function getComponentAccessToken(force = false) {
    if (!force && store.componentAccessToken && Date.now() < store.componentAccessTokenExpiresAt - 300000) {
      return store.componentAccessToken
    }
    if (!COMPONENT_APP_ID || !COMPONENT_SECRET || !store.componentVerifyTicket) {
      throw new Error('WeChat component app id, secret, or verify ticket is missing')
    }

    const json = await postWechat('/api_component_token', {
      component_appid: COMPONENT_APP_ID,
      component_appsecret: COMPONENT_SECRET,
      component_verify_ticket: store.componentVerifyTicket,
    })
    store.componentAccessToken = json.component_access_token
    store.componentAccessTokenExpiresAt = Date.now() + Number(json.expires_in || 7200) * 1000
    await persistToken('component_access_token', 'COMPONENT_ACCESS_TOKEN', store.componentAccessToken, store.componentAccessTokenExpiresAt, { expiresIn: json.expires_in })
    await persistEvent('COMPONENT_ACCESS_TOKEN_REFRESHED', json, { status: 'SUCCESS' })
    await saveStore()
    return store.componentAccessToken
  }

  async function getPreAuthCode(force = false) {
    if (!force && store.preAuthCode && Date.now() < store.preAuthCodeExpiresAt - 300000) {
      return store.preAuthCode
    }
    const componentAccessToken = await getComponentAccessToken()
    const json = await postWechat(`/api_create_preauthcode?component_access_token=${componentAccessToken}`, {
      component_appid: COMPONENT_APP_ID,
    })
    store.preAuthCode = json.pre_auth_code
    store.preAuthCodeExpiresAt = Date.now() + Number(json.expires_in || 600) * 1000
    await persistToken('pre_auth_code', 'PRE_AUTH_CODE', store.preAuthCode, store.preAuthCodeExpiresAt, { expiresIn: json.expires_in })
    await persistEvent('PRE_AUTH_CODE_CREATED', json, { status: 'SUCCESS' })
    await saveStore()
    return store.preAuthCode
  }

  async function queryAuthorization(authCode) {
    const componentAccessToken = await getComponentAccessToken()
    return postWechat(`/api_query_auth?component_access_token=${componentAccessToken}`, {
      component_appid: COMPONENT_APP_ID,
      authorization_code: authCode,
    })
  }

  async function upsertAuthorizer(record) {
    store.authorizers[record.authorizerAppId] = {
      ...(store.authorizers[record.authorizerAppId] || {}),
      ...record,
      updatedAt: new Date().toISOString(),
    }
    await persistAuthorizer(store.authorizers[record.authorizerAppId])
    await saveStore()
    return store.authorizers[record.authorizerAppId]
  }

  async function refreshAuthorizerAccessToken(authorizerAppId) {
    const record = store.authorizers[authorizerAppId]
    if (!record?.authorizerRefreshToken) {
      throw new Error(`Authorizer ${authorizerAppId} has no refresh token`)
    }
    const componentAccessToken = await getComponentAccessToken()
    const json = await postWechat(`/api_authorizer_token?component_access_token=${componentAccessToken}`, {
      component_appid: COMPONENT_APP_ID,
      authorizer_appid: authorizerAppId,
      authorizer_refresh_token: record.authorizerRefreshToken,
    })
    return upsertAuthorizer({
      authorizerAppId,
      authorizerAccessToken: json.authorizer_access_token,
      authorizerRefreshToken: json.authorizer_refresh_token || record.authorizerRefreshToken,
      expiresAt: Date.now() + Number(json.expires_in || 7200) * 1000,
      status: 'ACTIVE',
    })
  }

  async function getAuthorizerAccessToken(authorizerAppId) {
    const record = store.authorizers[authorizerAppId]
    if (!record) throw new Error(`Authorizer ${authorizerAppId} is not bound`)
    if (record.authorizerAccessToken && Date.now() < Number(record.expiresAt || 0) - 300000) {
      return record.authorizerAccessToken
    }
    const updated = await refreshAuthorizerAccessToken(authorizerAppId)
    return updated.authorizerAccessToken
  }

  async function handleAuthorizedCallback(req, res, parsePayload) {
    try {
      const payload = parsePayload(Object.keys(req.body || {}).length ? req.body : req.query)
      await persistEvent('AUTHORIZED_CALLBACK', payload, { status: 'RECEIVED' })
      const authCode = payload.auth_code || payload.authorization_code || req.query.auth_code || req.query.authorization_code
      if (authCode) {
        const result = await queryAuthorization(authCode)
        const info = result.authorization_info || {}
        const record = await upsertAuthorizer({
          authorizerAppId: info.authorizer_appid,
          authorizerAccessToken: info.authorizer_access_token,
          authorizerRefreshToken: info.authorizer_refresh_token,
          expiresAt: Date.now() + Number(info.expires_in || 7200) * 1000,
          funcInfo: info.func_info || [],
          rawPayload: result,
          status: 'ACTIVE',
        })
        return res.json({ success: true, data: record })
      }

      const appId = payload.authorizerAppId || payload.AuthorizerAppid || payload.appId || createId('authorizer')
      const record = await upsertAuthorizer({
        authorizerAppId: appId,
        nickName: payload.nickName || payload.NickName || '',
        rawPayload: payload,
        status: 'ACTIVE',
      })
      res.json({ success: true, data: record })
    } catch (error) {
      res.status(503).json({ success: false, error: error.message })
    }
  }

  return {
    getAuthorizerAccessToken,
    getComponentAccessToken,
    getPreAuthCode,
    handleAuthorizedCallback,
    queryAuthorization,
    refreshAuthorizerAccessToken,
    upsertAuthorizer,
  }
}

module.exports = {
  createPlatformAuthService,
}
