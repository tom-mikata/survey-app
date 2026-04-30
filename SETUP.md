# セットアップ手順書

新しい環境を構築する際の手順です。秘密情報（APIキー等）はEvernoteで管理しています。

---

## 構成概要

| 役割 | サービス |
|---|---|
| フロントエンド・ホスティング | Vercel |
| データベース・認証 | Supabase |
| メール送信 | Resend |
| ソースコード管理 | GitHub |
| DNSサービス | Value Domain |

### 環境

| 環境 | ブランチ | URL |
|---|---|---|
| 本番 | main | https://tom-survey-app.vercel.app |
| テスト | develop | https://survey-app-git-develop-tom-5990s-projects.vercel.app |

---

## 1. DNS設定（Value Domain）

メール送信に必要なDNSレコードです。`c-mikata.co.jp` に設定済み。

```
mx feedback-smtp.ap-northeast-1.amazonses.com. 10 send.c-mikata.co.jp.
txt send v=spf1 include:amazonses.com ~all
txt resend._domainkey [ResendのDKIM値]
```

> **注意**: MXレコードはValue Domainの形式 `mx [メールサーバー] [優先度] [サブドメイン]` で記述する。

---

## 2. Resend設定

### ドメイン認証

1. Resendダッシュボード → Domains → Add Domain
2. ドメイン: `c-mikata.co.jp`
3. 表示されたDNSレコードをValue Domainに追加
4. 「Verify Domain」をクリックして認証完了を確認

### APIキー作成

1. Resend → API Keys → Create API Key
2. Permission: **Sending access**
3. Domain: **c-mikata.co.jp**
4. 作成後すぐにキーを**Evernoteに保存**（再表示不可）

---

## 3. Supabase設定

本番（`survey-app`）とテスト（`survey-app-dev`）で同じ設定を行う。

### 3-1. マイグレーション実行

```bash
# プロジェクトをリンク
npx supabase link --project-ref [PROJECT_REF]

# マイグレーション実行
npx supabase db push
```

### 3-2. SMTP設定

**Authentication → Email → SMTP Settings**

| 項目 | 値 |
|---|---|
| Enable custom SMTP | ON |
| Sender email | `noreply@c-mikata.co.jp` |
| Sender name | `健康管理システム` |
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | ResendのAPIキー（Evernote参照） |

### 3-3. URL Configuration

**Authentication → URL Configuration**

| 項目 | 値 |
|---|---|
| Site URL | 本番: `https://tom-survey-app.vercel.app` / テスト: `https://survey-app-git-develop-tom-5990s-projects.vercel.app` |
| Redirect URLs | `https://tom-survey-app.vercel.app/**` および `https://*.vercel.app/**` |

### 3-4. メールテンプレート

**Authentication → Email → Templates → Recovery**

`supabase/templates/recovery.html` の内容を貼り付けて保存。

### 3-5. ユーザー作成

**Authentication → Users → Add user**

管理者・クライアント担当者のアカウントを作成し、`app_metadata` にロールを設定する。

```json
{
  "role": "system_admin"
}
```

または

```json
{
  "role": "client_admin",
  "client_code": "クライアントコード"
}
```

---

## 4. Vercel設定

### 環境変数

**Vercel → Project → Settings → Environment Variables**

`.env.example` を参照して以下を設定する。

| 変数名 | 環境 | 値の参照先 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production / Preview | SupabaseダッシュボードのProject Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production / Preview | 同上 |
| `SUPABASE_SERVICE_ROLE_KEY` | Production / Preview | 同上（Evernote参照） |
| `NEXT_PUBLIC_APP_URL` | Production のみ | `https://tom-survey-app.vercel.app` |

> **注意**: PreviewとProductionで異なるSupabaseプロジェクトのURLを設定する。

---

## 5. ローカル開発環境

```bash
# リポジトリをクローン
git clone https://github.com/tom-mikata/survey-app.git
cd survey-app

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して各値を入力（Evernote参照）

# 開発サーバー起動
npm run dev
```

---

## 6. デプロイフロー

```
ローカルで開発
    ↓
develop ブランチにプッシュ → Vercel テスト環境に自動デプロイ
    ↓
テスト環境で動作確認
    ↓
GitHub でPR作成（develop → main）
    ↓
マージ → Vercel 本番環境に自動デプロイ
```
