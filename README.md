# 健康アンケート管理システム

株式会社SO.向けの従業員健康アンケートシステムです。アンケートの回収・集計・ダッシュボード表示を行います。QQメソッド（Quantity and Quality method）に基づいてプレゼンティーイズム・アブセンティーイズムによる労働損失額を算出し、企業ごとの集計結果を管理者画面で可視化します。マルチテナント構成で複数クライアント企業を管理します。

> **⚠️ 重要：本番環境のデータベースには開発中は絶対に接続しないでください**
> 本システムは今後、従業員の氏名・生年月日などの個人情報を扱います。ローカル開発・機能テスト・データ投入は必ず**開発用Supabaseプロジェクト**に対して行ってください。`.env.local` に設定するURLが本番プロジェクトのURLになっていないことを毎回確認してください。本番URLは `https://[本番のref].supabase.co` です（Evernote参照）。

---

## 技術スタック

| 役割 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 |
| UIスタイリング | Tailwind CSS 4 |
| データベース・認証 | Supabase (PostgreSQL + Auth) |
| Supabaseクライアント | @supabase/ssr + @supabase/supabase-js |
| ホスティング | Vercel |
| メール送信 | Resend（Supabase SMTP経由） |

---

## ローカル開発環境のセットアップ

### 前提条件

- **Node.js 20 LTS 以上**（`node --version` で確認。開発機では v24 を使用）
- npm（Node.js に同梱）

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/tom-mikata/survey-app.git
cd survey-app

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数ファイルを作成
cp .env.example .env.local
# .env.local を開き、開発用Supabaseの値を入力する（Evernote参照）

# 4. 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと動作確認できます。

### シードデータの投入（任意）

開発用DBにテスト用の部署・症状選択肢・回答データを投入します。

```bash
# デフォルトで .env.local を読み込みます
npx ts-node --esm scripts/seed.ts

# 別の .env ファイルを使う場合
ENV_FILE=.env.local.dev npx ts-node --esm scripts/seed.ts
```

---

## ディレクトリ構成

```
survey-app/
├── src/
│   ├── app/                    # Next.js App Router ページ
│   │   ├── login/              # ログイン画面
│   │   ├── survey/             # アンケートフォーム（回答者向け、認証不要）
│   │   ├── results/            # 集計ダッシュボード（要ログイン）
│   │   ├── settings/           # 管理者設定（部署・症状選択肢・クライアント管理）
│   │   ├── change-password/    # パスワード変更
│   │   ├── auth/callback/      # メールリンク認証のコールバックエンドポイント
│   │   └── api/keepalive/      # Supabase自動停止防止のCron API（毎日0時）
│   ├── components/
│   │   └── AppChrome.tsx       # 共通レイアウト（ヘッダー・ナビゲーション）
│   ├── lib/
│   │   ├── supabase.ts         # Supabaseブラウザクライアント（遅延初期化Proxy）
│   │   ├── auth.ts             # ログインユーザー取得・サインアウト
│   │   ├── storage.ts          # DBアクセス関数（CRUD）
│   │   ├── types.ts            # 型定義
│   │   ├── constants.ts        # 定数（年齢区分・性別・症状選択肢のデフォルト）
│   │   ├── qq-method.ts        # QQメソッド計算ロジック（プレゼンティーイズム）
│   │   └── analytics.ts        # 集計・分析ロジック（損失額・部署別・WE集計）
│   └── middleware.ts           # 認証ミドルウェア（/results・/settings を保護）
├── supabase/
│   ├── migrations/             # DBマイグレーションSQL（supabase db push で適用）
│   └── templates/              # Supabaseのメールテンプレート（パスワードリセット）
├── scripts/
│   └── seed.ts                 # 開発用シードデータ投入スクリプト
├── docs/                       # 設計ドキュメント
├── .env.example                # 環境変数のテンプレート
├── SETUP.md                    # インフラ構築手順書（Vercel・Supabase・DNS設定）
└── vercel.json                 # Vercel Cron設定（keepalive: 毎日0時）
```

### ユーザーロール

| ロール | できること |
|---|---|
| `system_admin` | 全クライアントの閲覧・設定・管理 |
| `client_admin` | 自社クライアントの集計閲覧のみ |

ロールはSupabaseの `auth.users.app_metadata.role` で管理します。設定方法は `SETUP.md` を参照してください。

---

## 開発・本番環境の違い

| | ローカル | テスト (develop) | 本番 (main) |
|---|---|---|---|
| URL | `http://localhost:3000` | `https://survey-app-git-develop-...vercel.app` | `https://tom-survey-app.vercel.app` |
| Supabase | 開発プロジェクト | 開発プロジェクト | **本番プロジェクト** |
| 環境変数 | `.env.local` | Vercel Preview 環境変数 | Vercel Production 環境変数 |

### 注意事項

**`NEXT_PUBLIC_*` 変数はビルド時にJSバンドルへ埋め込まれます。** ランタイムでは切り替わりません。Vercelのプレビューデプロイで環境変数を変更した場合は、必ず**Redeploy**してビルドし直してください。

**Vercelのプレビュー環境変数のスコープ**に注意してください。特定ブランチ（例：`develop`）向けに設定した環境変数は、他のプレビューブランチ（例：`feature/*`）には引き継がれません。PRプレビューでSupabaseに接続させる場合は「すべてのプレビューブランチ」スコープで設定してください。

**Supabaseの無料プランはプロジェクトが7日間アクセスなしで自動停止します。** `vercel.json` に毎日0時のCron（`/api/keepalive`）を設定して防いでいます。開発プロジェクトが停止した場合はSupabaseダッシュボードから手動で再開してください。
