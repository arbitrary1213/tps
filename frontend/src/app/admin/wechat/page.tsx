'use client'

import { useEffect, useState } from 'react'
import { Badge, Button, Card, Input, Modal, Textarea } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { wechatAPI } from '@/lib/api'

export default function WechatAdminPage() {
  const { token } = useAuthStore()
  const [status, setStatus] = useState<any>(null)
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bindOpen, setBindOpen] = useState(false)
  const [bindForm, setBindForm] = useState({ authorizerAppId: '', authorizerNickName: '' })
  const [replyTarget, setReplyTarget] = useState<any>(null)
  const [replyContent, setReplyContent] = useState('')
  const [articleOpen, setArticleOpen] = useState(false)
  const [articleForm, setArticleForm] = useState({ title: '', author: '', digest: '', content: '' })

  useEffect(() => {
    load()
  }, [token])

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [nextStatus, nextMessages, nextArticles] = await Promise.all([
        wechatAPI.getStatus(token),
        wechatAPI.getMessages(token),
        wechatAPI.getArticles(token),
      ])
      setStatus(nextStatus)
      setMessages(nextMessages)
      setArticles(nextArticles)
      setBindForm({
        authorizerAppId: nextStatus?.authorizerAppId || '',
        authorizerNickName: nextStatus?.authorizerNickName || '',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAuthUrl = async () => {
    if (!token) return
    const info = await wechatAPI.getAuthUrl(token)
    setAuthInfo(info)
  }

  const bindAccount = async () => {
    if (!token) return
    await wechatAPI.bind(token, bindForm)
    setBindOpen(false)
    await load()
  }

  const openReply = (message: any) => {
    setReplyTarget(message)
    setReplyContent(message.aiSuggestion || '')
  }

  const sendReply = async () => {
    if (!token || !replyTarget) return
    await wechatAPI.replyMessage(token, replyTarget.id, replyContent)
    setReplyTarget(null)
    setReplyContent('')
    await load()
  }

  const createArticle = async () => {
    if (!token) return
    await wechatAPI.createArticle(token, articleForm)
    setArticleOpen(false)
    setArticleForm({ title: '', author: '', digest: '', content: '' })
    await load()
  }

  const publishArticle = async (id: string) => {
    if (!token || !confirm('确认发布这篇公众号文章吗？')) return
    await wechatAPI.publishArticle(token, id)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-ink">公众号运营</h2>
          <p className="text-sm text-tea/60 mt-1">在这里配置公众号授权、查看消息、确认 AI 回复建议和管理文章草稿。</p>
        </div>
        <Button onClick={load} loading={loading}>刷新</Button>
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-tea/60">绑定状态</div>
              <div className="mt-1">
                <Badge variant={status?.status === 'ACTIVE' ? 'success' : 'warning'}>{status?.status || 'UNBOUND'}</Badge>
              </div>
            </div>
            <div>
              <div className="text-xs text-tea/60">寺院编码</div>
              <div className="mt-1 text-sm text-ink">{status?.templeCode || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-tea/60">公众号 AppID</div>
              <div className="mt-1 text-sm text-ink">{status?.authorizerAppId || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-tea/60">公众号名称</div>
              <div className="mt-1 text-sm text-ink">{status?.authorizerNickName || '-'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadAuthUrl}>获取授权链接</Button>
            <Button onClick={() => setBindOpen(true)}>手动绑定</Button>
          </div>
        </div>

        {authInfo && (
          <div className="mt-4 rounded border border-[#E8E0D0] bg-paper p-4">
            <div className="text-sm font-medium text-ink">中心平台授权</div>
            {authInfo.authUrl ? (
              <a className="mt-2 block break-all text-sm text-vermilion hover:underline" href={authInfo.authUrl} target="_blank" rel="noreferrer">
                {authInfo.authUrl}
              </a>
            ) : (
              <p className="mt-2 text-sm text-tea/70">{authInfo.message || '中心平台尚未配置授权链接。'}</p>
            )}
            <p className="mt-2 text-xs text-tea/60">生产环境需要在中心 wechat-platform 服务配置微信开放平台参数。</p>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-ink">消息与 AI 回复建议</h3>
          </div>
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="rounded border border-[#E8E0D0] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-tea/70">{message.openId || '未知用户'}</span>
                  <Badge variant={message.status === 'REPLIED' ? 'success' : message.status === 'FAILED' ? 'danger' : 'info'}>{message.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink">{message.content || message.eventType || '-'}</p>
                {message.aiSuggestion && <p className="mt-2 rounded bg-paper p-2 text-sm text-tea">AI 建议：{message.aiSuggestion}</p>}
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => openReply(message)}>确认/编辑回复</Button>
              </div>
            ))}
            {messages.length === 0 && <p className="py-8 text-center text-tea/60">暂无公众号消息</p>}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-ink">文章草稿</h3>
            <Button size="sm" onClick={() => setArticleOpen(true)}>新建文章</Button>
          </div>
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="rounded border border-[#E8E0D0] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{article.title}</span>
                  <Badge variant={article.status === 'PUBLISHED' ? 'success' : article.status === 'FAILED' ? 'danger' : 'warning'}>{article.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-tea/70">{article.digest || '暂无摘要'}</p>
                <Button size="sm" variant="secondary" className="mt-3" disabled={article.status === 'PUBLISHED'} onClick={() => publishArticle(article.id)}>确认发布</Button>
              </div>
            ))}
            {articles.length === 0 && <p className="py-8 text-center text-tea/60">暂无文章草稿</p>}
          </div>
        </Card>
      </div>

      <Modal open={bindOpen} onClose={() => setBindOpen(false)} title="手动绑定公众号" size="md">
        <div className="space-y-4">
          <Input label="公众号 AppID" value={bindForm.authorizerAppId} onChange={(event) => setBindForm({ ...bindForm, authorizerAppId: event.target.value })} />
          <Input label="公众号名称" value={bindForm.authorizerNickName} onChange={(event) => setBindForm({ ...bindForm, authorizerNickName: event.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBindOpen(false)}>取消</Button>
            <Button onClick={bindAccount}>保存绑定</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title="确认公众号回复" size="md">
        <div className="space-y-4">
          <Textarea rows={6} value={replyContent} onChange={(event) => setReplyContent(event.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReplyTarget(null)}>取消</Button>
            <Button onClick={sendReply}>发送回复</Button>
          </div>
        </div>
      </Modal>

      <Modal open={articleOpen} onClose={() => setArticleOpen(false)} title="新建公众号文章" size="lg">
        <div className="space-y-4">
          <Input label="标题" value={articleForm.title} onChange={(event) => setArticleForm({ ...articleForm, title: event.target.value })} />
          <Input label="作者" value={articleForm.author} onChange={(event) => setArticleForm({ ...articleForm, author: event.target.value })} />
          <Input label="摘要" value={articleForm.digest} onChange={(event) => setArticleForm({ ...articleForm, digest: event.target.value })} />
          <Textarea label="正文" rows={10} value={articleForm.content} onChange={(event) => setArticleForm({ ...articleForm, content: event.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setArticleOpen(false)}>取消</Button>
            <Button onClick={createArticle}>保存草稿</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
