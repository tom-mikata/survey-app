"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, signOut } from "@/lib/auth";

export function AppChrome({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [surveyHref, setSurveyHref] = useState("/survey");

  useEffect(() => {
    getAuthUser().then((u) => {
      setUserEmail(u?.email ?? null);
      if (u?.role === "client_admin" && u.clientCode) {
        setSurveyHref(`/survey?client=${u.clientCode}`);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-sky-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-slate-700 font-semibold text-sm tracking-wide truncate">健康管理システム</p>
            {title ? <p className="text-xs text-slate-400 truncate">{title}</p> : null}
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-xs sm:text-sm flex-shrink-0">
          <Link href="/settings" className="text-slate-500 hover:text-sky-700 font-medium px-2 py-1 rounded-md hover:bg-sky-50">
            設定
          </Link>
          <Link href={surveyHref} className="text-slate-500 hover:text-sky-700 font-medium px-2 py-1 rounded-md hover:bg-sky-50">
            アンケート
          </Link>
          <Link href="/results" className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
            分析結果
          </Link>
          {userEmail && (
            <>
              <span className="text-slate-400 text-xs hidden sm:inline truncate max-w-[12rem]">{userEmail}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-slate-500 hover:text-red-600 font-medium px-2 py-1 rounded-md hover:bg-red-50 text-xs"
              >
                ログアウト
              </button>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
