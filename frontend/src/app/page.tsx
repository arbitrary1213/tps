'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero 区域 */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* 背景 */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1600&q=80)',
          }}
        >
          <div className="absolute inset-0 bg-ink/50" />
        </div>

        {/* 内容 */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-classic text-white mb-4 sm:mb-6 tracking-widest">
            仙顶寺
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 sm:mb-12 leading-relaxed sm:leading-loose tracking-wide sm:tracking-wider">
            精进行道 · 庄严国土 · 利乐有情
          </p>
          <Link 
            href="/register"
            className="inline-block bg-vermilion hover:bg-vermilion-dark text-white text-base sm:text-lg font-medium px-8 sm:px-12 py-3 sm:py-4 rounded tracking-wider sm:tracking-widest transition-all shadow-classic-lg active:scale-95"
          >
            在线登记
          </Link>
        </div>
      </main>

      {/* 底部信息 */}
      <footer className="relative z-10 bg-ink/80 backdrop-blur-sm py-4 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 text-center text-white/70 text-xs sm:text-sm tracking-wide">
          <p>浙江省湖州市吴兴区栖贤山仙顶禅寺</p>
        </div>
      </footer>
    </div>
  )
}
