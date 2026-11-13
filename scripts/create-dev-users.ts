/**
 * scripts/create-dev-users.ts
 *
 * 開発用 Supabase プロジェクト（ローカルまたはリモート開発環境）に
 * system_admin・client_admin ユーザーを作成する。
 *
 * 本番プロジェクトへの誤実行を防ぐガード付き。
 *
 * 実行:
 *   ADMIN_PASS="任意の8文字以上のパスワード" npx tsx scripts/create-dev-users.ts
 *
 * ローカルスタック（supabase start）に対して実行する場合:
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=<local service role key> \
 *   ADMIN_PASS="devpassword" \
 *   npx tsx scripts/create-dev-users.ts
 *
 * 冪等: 既存ユーザーはスキップする。
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ── 本番プロジェクトへの誤実行ガード ────────────────────────────
// supabase link されている本番プロジェクトの ref。
// この ref を含む URL に対しては処理を中止する。
const PROD_PROJECT_REF = "kjpzqgligymtrgkvryio";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください");
  process.exit(1);
}

if (supabaseUrl.includes(PROD_PROJECT_REF)) {
  console.error("本番プロジェクトへの実行を検知しました。処理を中止します。");
  console.error(`URL: ${supabaseUrl}`);
  process.exit(1);
}

const pass = process.env.ADMIN_PASS ?? "";
if (pass.length < 8) {
  console.error("ADMIN_PASS が未設定または8文字未満です");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── 作成するユーザー定義 ───────────────────────────────────────
// /api/admin/accounts の POST ハンドラと同じ app_metadata 構造。
// ローカルでは inviteUserByEmail（SMTP依存）の代わりに createUser を使う。
const USERS = [
  {
    email: "system-admin@example.com",
    app_metadata: { role: "system_admin", client_code: null },
    label: "system_admin",
  },
  {
    email: "soxx-admin@example.com",
    app_metadata: { role: "client_admin", client_code: "soxx" },
    label: "client_admin (soxx)",
  },
];

async function main() {
  console.log(`接続先: ${supabaseUrl}`);

  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingEmails = new Set((existing?.users ?? []).map((u) => u.email));

  for (const u of USERS) {
    if (existingEmails.has(u.email)) {
      console.log(`SKIP  ${u.email} (既存)`);
      continue;
    }

    const { error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: pass,
      app_metadata: u.app_metadata,
      email_confirm: true,
    });

    if (error) {
      console.error(`ERROR ${u.email}: ${error.message}`);
      process.exit(1);
    }

    console.log(`OK    ${u.email}  [${u.label}]`);
  }

  console.log("\n作成完了。ログイン確認:");
  for (const u of USERS) {
    console.log(`  ${u.email} / ${pass}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
