import { NextRequest, NextResponse } from 'next/server'
import { resolveRemoteBase } from '@/lib/proxy-whitelist'

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  let remoteBase: string
  try {
    remoteBase = resolveRemoteBase(req.headers.get('x-temple-api-base'))
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 })
  }

  const { path } = await context.params
  const url = new URL(req.url)
  const targetUrl = `${remoteBase}/export/${path.join('/')}${url.search}`
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
