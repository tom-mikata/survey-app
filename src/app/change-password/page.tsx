"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "request" | "reset" | "request_sent" | "done";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // ログイン済み（リセットリンク経由含む）ならパスワード入力モードに
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setMode("reset");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setMode("reset");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/change-password`,
    });
    if (error) {
      setError("メール送信に失敗しました。メールアドレスをご確認ください。");
    } else {
      setMode("request_sent");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("パスワードの変更に失敗しました。再度お試しください。");
    } else {
      setMode("done");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-slate-700 font-bold text-base tracking-wide">健康管理システム</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8">

          {/* メール送信済み */}
          {mode === "request_sent" && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-slate-800">メールを送信しました</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                パスワード変更用のリンクを送信しました。メールをご確認のうえ、リンクをクリックしてください。
              </p>
              <Link href="/login" className="block text-sm text-sky-600 hover:underline mt-2">
                ログインページへ戻る
              </Link>
            </div>
          )}

          {/* 完了 */}
          {mode === "done" && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-slate-800">パスワードを変更しました</h1>
              <p className="text-sm text-slate-500">新しいパスワードでログインしてください。</p>
              <Link href="/login" className="block text-sm text-sky-600 hover:underline mt-2">
                ログインページへ
              </Link>
            </div>
          )}

          {/* メールアドレス入力 */}
          {mode === "request" && (
            <>
              <h1 className="text-xl font-bold text-slate-800 mb-1">パスワード変更</h1>
              <p className="text-sm text-slate-500 mb-6">
                登録済みのメールアドレスに変更用リンクを送信します。
              </p>
              <form onSubmit={handleRequest} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">メールアドレス</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  />
                </label>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
                >
                  {loading ? "送信中..." : "変更用リンクを送信"}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-slate-400">
                <Link href="/login" className="text-sky-600 hover:underline">ログインページへ戻る</Link>
              </p>
            </>
          )}

          {/* 新しいパスワード入力（リセットリンク経由） */}
          {mode === "reset" && (
            <>
              <h1 className="text-xl font-bold text-slate-800 mb-1">新しいパスワード</h1>
              <p className="text-sm text-slate-500 mb-6">8文字以上のパスワードを設定してください。</p>
              <form onSubmit={handleReset} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">新しいパスワード</span>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">確認</span>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  />
                </label>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
                >
                  {loading ? "変更中..." : "パスワードを変更する"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
