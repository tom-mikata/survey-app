import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-sky-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
          <span className="text-slate-700 font-semibold text-sm tracking-wide">健康管理システム</span>
        </div>
        <nav className="hidden sm:flex items-center gap-2 text-xs">
          <Link href="/settings" className="text-slate-500 hover:text-sky-700 font-medium px-2 py-1 rounded-md hover:bg-sky-50">
            設定
          </Link>
          <Link href="/survey" className="text-slate-500 hover:text-sky-700 font-medium px-2 py-1 rounded-md hover:bg-sky-50">
            アンケート
          </Link>
          <Link
            href="/results"
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            分析結果
          </Link>
        </nav>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-8 py-16">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-10 py-12 mb-8">
          <span className="inline-block bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full tracking-wider mb-6">
            2026年度 定期健康診断
          </span>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-4">
            従業員健康診断アンケート
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl">
            本アンケートは、従業員の皆様の健康状態を把握し、職場環境の改善および健康増進施策に役立てることを目的としています。
            回答内容は適切に管理され、個人が特定される形で利用されることはありません。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/survey"
              className="inline-flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              アンケートを開始する
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold px-6 py-3 rounded-lg border border-slate-200 transition-colors"
            >
              部署を登録する
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
              label: "所要時間",
              value: "約10分",
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ),
              label: "個人情報保護",
              value: "厳重管理",
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ),
              label: "回答期限",
              value: "2026年5月31日",
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {icon}
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-sm text-slate-700 font-semibold mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
