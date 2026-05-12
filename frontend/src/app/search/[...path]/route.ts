import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_REMOTE_API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || ''

function resolveRemoteBase(req: NextRequest) {
  const headerBase = req.headers.get('x-temple-api-base')
  return (headerBase || DEFAULT_REMOTE_API_BASE).replace(/\/+$/, '')
}

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const remoteBase = resolveRemoteBase(req)
  if (!remoteBase) {
    return NextResponse.json({ success: false, error: 'Server API base is not configured' }, { status: 500 })
  }

  const { path } = await context.params
  const url = new URL(req.url)
  const targetUrl = `${remoteBase}/search/${path.join('/')}${url.search}`
  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('content-length')
  headers.delete('x-temple-api-base')

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: 'manual',
  })

  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
