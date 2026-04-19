import Link from "next/link";
import { AppChrome } from "@/components/AppChrome";

export default function SurveyCompletePage() {
  return (
    <AppChrome title="送信完了">
      <main className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">回答ありがとうございました</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-10">
          送信が完了しました。集計には個人を特定する情報は含まれません。
        </p>
        <Link
          href="/results"
          className="inline-block bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-8 py-3 rounded-xl"
        >
          分析結果を見る
        </Link>
        <p className="mt-6">
          <Link href="/" className="text-sm text-sky-600 hover:underline">
            トップへ
          </Link>
        </p>
      </main>
    </AppChrome>
  );
}
