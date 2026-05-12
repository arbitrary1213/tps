# Temple OS WeChat Platform

## Architecture

Temple OS uses a central WeChat platform service for multi-account official account operations.

- Center service receives WeChat third-party platform authorization callbacks and message callbacks.
- Customer Temple OS servers store temple business data and synchronized WeChat operation records.
- Desktop app is an operation console only. It does not receive WeChat callbacks directly.

## First Version

- Article workflow: create draft, edit draft, admin confirms publishing.
- AI reply workflow: generate suggestion, staff confirms before sending.
- Template message workflow: ritual and plaque reminders.
- Customer server talks to center service through `WECHAT_PLATFORM_BASE_URL` and `WECHAT_PLATFORM_API_TOKEN`.

## Services

### Customer Server

Implemented API surface:

- `GET /api/integrations/wechat/status`
- `POST /api/integrations/wechat/bind`
- `GET /api/wechat/messages`
- `POST /api/wechat/messages/:id/reply`
- `POST /api/wechat/messages/sync`
- `GET /api/wechat/articles`
- `POST /api/wechat/articles`
- `POST /api/wechat/articles/:id/publish`
- `POST /api/wechat/template-messages/send`

### Center Platform

Implemented skeleton service in `wechat-platform/`.

- `POST /wechat-platform/callback/component`
- `GET /wechat-platform/auth-url`
- `POST /wechat-platform/callback/authorized`
- `GET /wechat-platform/callback/authorized`
- `POST /wechat-platform/callback/message/:authorizerAppId`
- `GET /wechat-platform/authorizers`
- `GET /wechat-platform/messages`
- `GET /wechat-platform/tokens`
- `GET /wechat-platform/events`
- `POST /wechat-platform/articles/draft`
- `POST /wechat-platform/articles/publish`
- `POST /wechat-platform/messages/reply`
- `POST /wechat-platform/template-messages/send`

The current implementation supports two persistence modes:

- With `DATABASE_URL`: store center-platform state in PostgreSQL table `wechat_platform_store`.
- Without `DATABASE_URL`: store center-platform state in `wechat-platform/data/store.json`.

When PostgreSQL is enabled, the service also creates normalized query tables:

- `wechat_platform_authorizers`
- `wechat_platform_messages`
- `wechat_platform_articles`
- `wechat_platform_template_messages`
- `wechat_platform_tokens`
- `wechat_platform_events`

The JSON file mode is acceptable for development and early validation only. Production should use PostgreSQL with backup and audit logging.

Implemented WeChat Open Platform foundations:

- Receive component verify ticket at `/wechat-platform/callback/component`.
- Refresh `component_access_token` through WeChat `api_component_token`.
- Generate `pre_auth_code` through WeChat `api_create_preauthcode`.
- Build the official account authorization URL with a real `pre_auth_code`.
- Query authorization through WeChat `api_query_auth`.
- Persist authorizer token fields in the center-platform store.
- Refresh authorizer access tokens through WeChat `api_authorizer_token`.
- Send confirmed customer-service replies through WeChat `/message/custom/send`.
- Create article drafts through WeChat `/draft/add`.
- Submit article publishing through WeChat `/freepublish/submit`.
- Send template messages through WeChat `/message/template/send`.
- Persist platform tokens and callback events for diagnostics and later retry/audit workflows.

`WECHAT_PLATFORM_DRY_RUN` defaults to enabled unless explicitly set to `false`. Keep dry-run enabled during development to avoid publishing articles or sending messages from test operations.

## Environment

Customer server:

- `WECHAT_PLATFORM_BASE_URL`
- `WECHAT_PLATFORM_API_TOKEN`
- `PUBLIC_SERVER_URL`

Center platform:

- `PORT`
- `PUBLIC_BASE_URL`
- `WECHAT_COMPONENT_APP_ID`
- `WECHAT_COMPONENT_SECRET`
- `WECHAT_COMPONENT_TOKEN`
- `WECHAT_COMPONENT_ENCODING_AES_KEY`
- `WECHAT_PLATFORM_API_TOKEN`
- `WECHAT_PLATFORM_DRY_RUN`
- `WECHAT_PLATFORM_DATA_DIR`

Environment templates:

- `backend/.env.example`
- `wechat-platform/.env.example`
- `docker/.env.example`

## Where to Configure Official Accounts

There are three configuration layers:

1. WeChat Open Platform console
   - Configure the third-party platform app id, secret, token, and encoding AES key.
   - Configure authorization event callback URL to point at `/wechat-platform/callback/component`.
   - Configure official account message callback URL to point at `/wechat-platform/callback/message/$APPID`, using the authorized official account app id in the final callback route.

2. Central WeChat platform service
   - Copy `wechat-platform/.env.example` to `.env`.
   - Set `PUBLIC_BASE_URL`, `WECHAT_COMPONENT_APP_ID`, `WECHAT_COMPONENT_SECRET`, `WECHAT_COMPONENT_TOKEN`, `WECHAT_COMPONENT_ENCODING_AES_KEY`, `WECHAT_PLATFORM_API_TOKEN`, and `WECHAT_PLATFORM_DRY_RUN`.
   - Start `wechat-platform`.

3. Customer Temple OS server
   - Set `WECHAT_PLATFORM_BASE_URL`, `WECHAT_PLATFORM_API_TOKEN`, and `PUBLIC_SERVER_URL`.
   - In the Temple OS admin/desktop UI, open `公众号运营 -> 公众号控制台`.
   - Use `获取授权链接` for official account authorization, or `手动绑定` for temporary development binding.

## Production Gaps

- Stop writing the compatibility JSON row after normalized tables are fully verified in production.
- Implement media upload and cover-image management for article drafts.
- Implement publication status polling for free-publish tasks.
- Add retry, audit log, and alerting for token refresh and message send failures.
