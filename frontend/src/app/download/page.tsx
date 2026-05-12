export default function DownloadPage() {
  const serverUrl = process.env.NEXT_PUBLIC_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_API_BASE || ''

  return (
    <main className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section>
          <h1 className="text-3xl font-serif text-ink">Temple OS 下载中心</h1>
          <p className="mt-2 text-tea/70">下载寺院本地工作台、服务器安装助手，并查看当前服务器连接地址。</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#E8E0D0] bg-white p-6 shadow-classic">
            <h2 className="text-lg font-medium text-ink">桌面端工作台</h2>
            <p className="mt-2 text-sm text-tea/70">用于登记审批、信众管理、牌位管理、模板打印和公众号运营。</p>
            <a className="mt-4 inline-flex rounded bg-vermilion px-5 py-2 text-sm font-medium text-white" href="/downloads/TempleOS-Desktop-Setup.exe">
              下载 Windows 桌面端
            </a>
          </div>

          <div className="rounded-lg border border-[#E8E0D0] bg-white p-6 shadow-classic">
            <h2 className="text-lg font-medium text-ink">服务器安装助手</h2>
            <p className="mt-2 text-sm text-tea/70">用于连接 SSH 自动部署新服务器，或绑定已有服务器。</p>
            <a className="mt-4 inline-flex rounded border border-vermilion px-5 py-2 text-sm font-medium text-vermilion" href="/downloads/TempleOS-Setup.exe">
              下载安装助手
            </a>
          </div>
        </section>

        <section className="rounded-lg border border-[#E8E0D0] bg-white p-6 shadow-classic">
          <h2 className="text-lg font-medium text-ink">当前服务器地址</h2>
          <p className="mt-2 rounded bg-paper p-3 font-mono text-sm text-ink">{serverUrl || '请使用当前网站域名作为服务器地址'}</p>
          <p className="mt-3 text-sm text-tea/60">桌面端首次启动时选择“连接已有服务器”，填入此地址即可。</p>
        </section>
      </div>
    </main>
  )
}
