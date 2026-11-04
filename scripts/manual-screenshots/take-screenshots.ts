/**
 * scripts/manual-screenshots/take-screenshots.ts
 *
 * マニュアル掲載用スクリーンショットを自動撮影する。
 *
 * 前提:
 *   - seed-demo.ts が実行済みであること
 *   - ローカル開発サーバーが http://localhost:3000 で起動していること
 *   - 環境変数を設定していること:
 *       export SCREENSHOT_ADMIN_PASS="tom@c-mikata.co.jp のパスワード"
 *       export DEMO_ADMIN_PASS="demo-admin@example.com のパスワード"
 *
 * 実行:
 *   npm run dev & sleep 5 && npx tsx scripts/manual-screenshots/take-screenshots.ts
 */

import { chromium, Page } from "playwright";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ─── 設定 ──────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "docs/manual/screenshots");
const ADMIN_EMAIL = "tom@c-mikata.co.jp";
const ADMIN_PASS = process.env.SCREENSHOT_ADMIN_PASS ?? "";
const CLIENT_EMAIL = "demo-admin@example.com";
const CLIENT_PASS = process.env.DEMO_ADMIN_PASS ?? "";

// Supabase（ラウンドID取得用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── 記録 ──────────────────────────────────────────────────────────────────────

const taken: string[] = [];
const skipped: { file: string; reason: string }[] = [];

function skip(file: string, reason: string) {
  skipped.push({ file, reason });
  console.warn(`  ✗ SKIP ${file}: ${reason}`);
}

async function shot(page: Page, filename: string, options?: {
  selector?: string;
  clip?: { x: number; y: number; width: number; height: number };
  fullPage?: boolean;
  scrollTo?: string;
}) {
  const filepath = path.join(OUT_DIR, filename);
  try {
    if (options?.scrollTo) {
      await page.locator(options.scrollTo).first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    if (options?.selector) {
      const el = page.locator(options.selector).first();
      await el.waitFor({ timeout: 8000 });
      await el.screenshot({ path: filepath });
    } else {
      await page.screenshot({
        path: filepath,
        clip: options?.clip,
        fullPage: options?.fullPage,
      });
    }
    taken.push(filename);
    console.log(`  ✓ ${filename}`);
  } catch (e) {
    skip(filename, (e as Error).message.split("\n")[0]);
  }
}

// ─── ナビゲーションヘルパー ────────────────────────────────────────────────────

async function login(page: Page, email: string, pass: string, dest: "settings" | "results" = "settings") {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/${dest}**`, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "ログアウト" }).click();
  await page.waitForURL("**/login", { timeout: 8000 });
}

async function gotoSettings(page: Page, tab: "クライアント" | "部署" | "実施回" | "管理者アカウント") {
  if (!page.url().includes("/settings")) {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
  }
  await page.getByRole("button", { name: tab }).click();
  await page.waitForTimeout(400);
}

async function selectClientInTab(page: Page, clientCode: string) {
  await page.locator("select").first().selectOption(clientCode);
  await page.waitForTimeout(600);
}

// ─── 第1章: ログインと画面の見方 ──────────────────────────────────────────────

async function ch1Login(page: Page) {
  console.log("\n【第1章】ログインと画面の見方");

  // 1-01: ログイン画面
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await shot(page, "1-01-login.png");

  // 1-02: ログイン失敗エラー
  await page.fill('input[type="email"]', "wrong@example.com");
  await page.fill('input[type="password"]', "wrongpass");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  await shot(page, "1-02-login-error.png");

  // 1-03: パスワード変更画面（メール入力）
  await page.goto(`${BASE_URL}/change-password`);
  await page.waitForSelector('input[type="email"]');
  await shot(page, "1-03-change-password-request.png");

  // 1-04: 新パスワード入力画面（ログイン状態でアクセスすると reset モードになる）
  await login(page, ADMIN_EMAIL, ADMIN_PASS, "settings");
  await page.goto(`${BASE_URL}/change-password`);
  await page.waitForTimeout(1500); // session check
  await shot(page, "1-04-change-password-reset.png");

  // 1-05: ログイン後ヘッダー (system_admin)
  await page.goto(`${BASE_URL}/settings`);
  await page.waitForLoadState("networkidle");
  await shot(page, "1-05-header-system-admin.png", { clip: { x: 0, y: 0, width: 1280, height: 72 } });

  // 1-06: ログイン後ヘッダー (client_admin) — ログアウト→client_adminでログイン
  await logout(page);
  await login(page, CLIENT_EMAIL, CLIENT_PASS, "results");
  await shot(page, "1-06-header-client-admin.png", { clip: { x: 0, y: 0, width: 1280, height: 72 } });
  await logout(page);
}

// ─── 第2章: 準備する ──────────────────────────────────────────────────────────

async function ch2Settings(page: Page) {
  console.log("\n【第2章】準備する");
  await login(page, ADMIN_EMAIL, ADMIN_PASS, "settings");

  // 2-1-01: クライアントタブ（登録フォーム＋一覧）
  await gotoSettings(page, "クライアント");
  await page.waitForTimeout(500);
  await shot(page, "2-1-01-clients-tab.png", { clip: { x: 0, y: 64, width: 1280, height: 740 } });

  // 2-1-02: 編集状態（見本株式会社の編集ボタン押下）
  const editBtn = page.locator("button", { hasText: "編集" }).first();
  await editBtn.click();
  await page.waitForTimeout(400);
  await shot(page, "2-1-02-client-edit.png", { clip: { x: 0, y: 64, width: 1280, height: 740 } });
  // 編集キャンセル
  const cancelBtn = page.locator("button", { hasText: "キャンセル" }).first();
  if (await cancelBtn.isVisible()) await cancelBtn.click();

  // 2-3-01: 部署タブ
  await gotoSettings(page, "部署");
  await selectClientInTab(page, "demo");
  await shot(page, "2-3-01-departments-tab.png", { clip: { x: 0, y: 64, width: 1280, height: 740 } });

  // 2-4-01: 実施回タブ（作成フォーム＋一覧）
  await gotoSettings(page, "実施回");
  await selectClientInTab(page, "demo");
  await page.waitForTimeout(500);
  await shot(page, "2-4-01-rounds-tab.png", { clip: { x: 0, y: 64, width: 1280, height: 740 } });

  // 2-4-02: 終了日 < 開始日のバリデーションエラー
  // タイトル入力
  const titleInput = page.locator('input[placeholder*="第1回"]');
  await titleInput.fill("テスト実施回");
  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.nth(0).fill("2027-09-30"); // 開始日
  await dateInputs.nth(1).fill("2027-09-01"); // 終了日（開始日より前）
  await page.locator("button", { hasText: "追加する" }).click();
  await page.waitForTimeout(500);
  await shot(page, "2-4-02-round-date-error.png", { clip: { x: 0, y: 64, width: 1280, height: 740 } });
  // 入力欄をクリア
  await titleInput.fill("");
  await dateInputs.nth(0).fill("");
  await dateInputs.nth(1).fill("");
}

// ─── 第3章: 配布する ──────────────────────────────────────────────────────────

async function ch3Survey(page: Page, round1Id: number, round2Id: number) {
  console.log("\n【第3章】配布する");

  // 3-1-01: 実施回タブの回答URL＋コピーボタン
  await gotoSettings(page, "実施回");
  await selectClientInTab(page, "demo");
  await page.waitForTimeout(500);
  await shot(page, "3-1-01-survey-url.png", { clip: { x: 0, y: 64, width: 1280, height: 500 } });

  // ── アンケート画面 ───────────────────────────────────────────
  const surveyUrl = `${BASE_URL}/survey?client=demo&round=${round1Id}`;

  // 3-6-01: 個人情報の同意画面（モーダル）
  await page.goto(surveyUrl);
  await page.waitForTimeout(1500);
  await shot(page, "3-6-01-privacy-modal.png");

  // 3-6-02: 同意せずに閉じたときのメッセージ
  // × ボタンをクリック（aria-label="閉じる" または ×/✕ テキスト）
  const closeBtn = page.locator('button[aria-label="閉じる"]').or(
    page.locator('button').filter({ hasText: /^[×✕]$/ })
  ).first();
  if (await closeBtn.isVisible({ timeout: 3000 })) {
    await closeBtn.click();
  } else {
    // Escキーで閉じる（ダイアログ外クリック相当）
    await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(800);
  await shot(page, "3-6-02-consent-declined.png");

  // 3-6-03: 問1〜5（基本情報）
  await page.goto(surveyUrl);
  await page.waitForTimeout(1500);
  await page.locator("button", { hasText: "同意して進む" }).click();
  await page.waitForTimeout(600);
  await shot(page, "3-6-03-q1-5-basic-info.png");

  // 3-6-04: 問6（症状の選択）—— Q1-5を記入してNext
  await page.locator('input[placeholder*="山田"]').fill("見本 太郎");
  await page.locator('input[placeholder*="ヤマダ"]').fill("ミホン タロウ");
  await page.locator('button[type="button"]').filter({ hasText: "男性" }).click();
  await page.locator('input[type="date"]').fill("1980-04-01");
  // 部署セレクト
  const deptSelect = page.locator("select");
  await deptSelect.waitFor({ timeout: 5000 });
  await deptSelect.selectOption("総務部");
  await page.locator('button[type="button"]').filter({ hasText: "正社員" }).click();
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(600);
  await shot(page, "3-6-04-q6-symptoms.png");

  // 3-6-05: 問10・11（症状を1つ選んでQ10/11画面まで進む）
  // lower_back（腰痛）のチェックボックスをクリック
  await page.locator('button[type="button"]').filter({ hasText: "腰痛" }).first().click();
  await page.waitForTimeout(200);
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(600);
  // Q8-9 スキップしてQ10-11が見える位置にスクロール
  const q10area = page.locator("text=仕事量").first();
  if (await q10area.isVisible({ timeout: 3000 })) {
    await q10area.scrollIntoViewIfNeeded();
  }
  await shot(page, "3-6-05-q10-11-score.png");

  // 3-6-06: 最終画面の「回答を送信」（none症状で最短ルート）
  await page.goto(surveyUrl);
  await page.waitForTimeout(1500);
  await page.locator("button", { hasText: "同意して進む" }).click();
  await page.waitForTimeout(400);
  // Q1-5
  await page.locator('input[placeholder*="山田"]').fill("見本 花子");
  await page.locator('input[placeholder*="ヤマダ"]').fill("ミホン ハナコ");
  await page.locator('button[type="button"]').filter({ hasText: "女性" }).click();
  await page.locator('input[type="date"]').fill("1985-06-15");
  await page.locator("select").selectOption("営業部");
  await page.locator('button[type="button"]').filter({ hasText: "正社員" }).click();
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(500);
  // Q6: 「不調はない」を選択
  await page.locator('button[type="button"]').filter({ hasText: "健康上の問題や不調はない" }).click();
  await page.waitForTimeout(200);
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(500);

  // Q12-14 (StepPainCare)
  await page.locator('button[type="button"]').filter({ hasText: "利用していない" }).click();
  await page.waitForTimeout(200);
  await page.locator('button[type="button"]').filter({ hasText: "使っていない" }).click();
  await page.waitForTimeout(200);
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(500);

  // Q15-16 (StepConsultation) — 「ない」を4回選択
  for (let i = 0; i < 4; i++) {
    const naiBtn = page.locator('button[type="button"]').filter({ hasText: /^ない$/ }).nth(i);
    if (await naiBtn.isVisible({ timeout: 2000 })) await naiBtn.click();
  }
  const expertBtn = page.locator("button", { hasText: "思わない" }).first();
  if (await expertBtn.isVisible({ timeout: 2000 })) await expertBtn.click();
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(500);

  // Q17 (StepMentalHealth) — 6項目全て「全くない」
  for (let i = 0; i < 6; i++) {
    const btn = page.locator("button", { hasText: "全くない" }).nth(i);
    if (await btn.isVisible({ timeout: 2000 })) await btn.click();
  }
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(500);

  // Q18 (StepCompanySupport) — 4項目「どちらともいえない」
  for (let i = 0; i < 4; i++) {
    const btn = page.locator("button", { hasText: "どちらともいえない" }).nth(i);
    if (await btn.isVisible({ timeout: 2000 })) await btn.click();
  }
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(500);

  // Q19-20 (StepWorkLife)
  const q19btn = page.locator("button", { hasText: "まったくない" }).first();
  if (await q19btn.isVisible({ timeout: 2000 })) await q19btn.click();
  await page.waitForTimeout(200);
  // Q20: 「必要ない」を選択
  const q20btn = page.locator('button[type="button"]').filter({ hasText: "必要ない" }).first();
  if (await q20btn.isVisible({ timeout: 2000 })) await q20btn.click();
  await page.waitForTimeout(200);
  await page.locator("button", { hasText: "次へ" }).click();
  await page.waitForTimeout(500);

  // Q21-22 (StepExercise) — 最後の画面
  // 「していない」を選択
  const noExercise = page.locator("button", { hasText: "していない" }).first();
  if (await noExercise.isVisible({ timeout: 3000 })) await noExercise.click();
  await page.waitForTimeout(300);
  await shot(page, "3-6-06-survey-submit-button.png");

  // 3-6-07: 送信完了画面
  const submitBtn = page.locator("button", { hasText: "回答を送信" }).first();
  if (await submitBtn.isVisible({ timeout: 3000 })) {
    await submitBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, "3-6-07-survey-complete.png");
  } else {
    skip("3-6-07-survey-complete.png", "「回答を送信」ボタンが見つからなかった");
  }

  // 3-6-08: URLエラー（client パラメータなし）
  await page.goto(`${BASE_URL}/survey`);
  await page.waitForTimeout(1500);
  await shot(page, "3-6-08-survey-url-error.png");
}

// ─── 第4章: アカウント管理 ────────────────────────────────────────────────────

async function ch4Accounts(page: Page) {
  console.log("\n【第4章】アカウント管理");

  // 4-1-01: 管理者アカウントタブ（招待フォーム＋一覧）
  await gotoSettings(page, "管理者アカウント");
  await page.waitForTimeout(800);
  await shot(page, "4-1-01-accounts-tab.png", { clip: { x: 0, y: 64, width: 1280, height: 740 } });

  // 4-1-02: client_admin を選択したときの「所属クライアント」選択欄
  // ロールセレクトで client_admin を選ぶ
  const roleSelect = page.locator("select").first();
  await roleSelect.selectOption("client_admin");
  await page.waitForTimeout(400);
  await shot(page, "4-1-02-client-admin-client-select.png", { clip: { x: 0, y: 64, width: 1280, height: 400 } });
  // リセット
  await roleSelect.selectOption("system_admin");
}

// ─── 第5章: 結果を見る ─────────────────────────────────────────────────────────

async function ch5Results(page: Page, round1Id: number, round2Id: number) {
  console.log("\n【第5章】結果を見る");

  await page.goto(`${BASE_URL}/results`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // クライアント "demo" を選択し、表示実施回を明示的に第2回（データあり）に設定
  const clientSelect = page.locator("select").first();
  if (await clientSelect.isVisible({ timeout: 3000 })) {
    await clientSelect.selectOption("demo");
    await page.waitForTimeout(1000);
    // 表示実施回（今回）は nth(2)。第3回（空）が自動選択されるため第2回を明示指定
    const displayRoundSelect = page.locator("select").nth(2);
    if (await displayRoundSelect.isVisible({ timeout: 3000 })) {
      await displayRoundSelect.selectOption({ value: String(round2Id) });
      await page.waitForTimeout(800);
    }
  }

  // 5-1-01: フィルター行（クライアント＋実施回セレクト）
  await shot(page, "5-1-01-results-filter-row.png", { clip: { x: 0, y: 64, width: 1280, height: 180 } });

  // 5-1-02: 全クライアント選択時（実施回が空になる）
  if (await clientSelect.isVisible({ timeout: 2000 })) {
    await clientSelect.selectOption({ value: "" }); // value="" = "全クライアント"
    await page.waitForTimeout(600);
    await shot(page, "5-1-02-all-clients-empty-rounds.png", { clip: { x: 0, y: 64, width: 1280, height: 180 } });
    // demo に戻す
    await clientSelect.selectOption("demo");
    await page.waitForTimeout(800);
  } else {
    skip("5-1-02-all-clients-empty-rounds.png", "クライアントセレクタが見つからなかった");
  }

  // 5-2-01: 軸セグメントタブ（部署ごと/年代ごと/性別ごと）
  await shot(page, "5-2-01-axis-segment-tabs.png", { clip: { x: 0, y: 160, width: 1280, height: 100 } });

  // カード撮影（各カードを探してスクロール）
  const shootCard = async (filename: string, heading: string) => {
    const cardEl = page.locator(`text=${heading}`).first();
    if (await cardEl.isVisible({ timeout: 5000 })) {
      await cardEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const cardContainer = cardEl.locator("xpath=../..").first();
      try {
        await cardContainer.screenshot({ path: path.join(OUT_DIR, filename) });
        taken.push(filename);
        console.log(`  ✓ ${filename}`);
      } catch {
        await shot(page, filename);
      }
    } else {
      skip(filename, `ヘッダー「${heading}」が見つからなかった`);
    }
  };

  await shootCard("5-3-01-card-loss-count.png", "損失額が生じている従業員数");
  await shootCard("5-3-02-card-labor-loss.png", "職業病起因の労働損失額");

  // Card 2: 「健康問題」ビューに切り替えてから撮影
  const card2ToggleSelect = page.locator("select").filter({ hasText: "損失額" }).first();
  if (await card2ToggleSelect.isVisible({ timeout: 3000 })) {
    await card2ToggleSelect.selectOption("health");
    await page.waitForTimeout(400);
    await shootCard("5-3-03-card-health-issues.png", "健康問題を抱える従業員数");
    // 「損失額」ビューに戻す
    await card2ToggleSelect.selectOption("loss");
    await page.waitForTimeout(300);
  } else {
    skip("5-3-03-card-health-issues.png", "カード2トグルセレクタが見つからなかった");
  }

  await shootCard("5-3-04-card-pain-map.png", "痛みの部位");
  await shootCard("5-3-05-card-dept-loss.png", "部署ごとの労働損失額");

  // 5-5-01: 設問別結果（問6〜11）
  // 全クライアント→demo と切り替えると autoSelectDoneRef のレース状態で rows=[] になる場合があるため、
  // ここで /results を再ロードして実施回の自動選択を確実にトリガーする。
  await page.goto(`${BASE_URL}/results`);
  await page.waitForLoadState("networkidle");
  const reloadClientSelect = page.locator("select").first();
  if (await reloadClientSelect.isVisible({ timeout: 3000 })) {
    await reloadClientSelect.selectOption("demo");
    await page.waitForTimeout(1000);
    // 表示実施回を第2回（データあり）に明示指定
    const reloadDisplaySelect = page.locator("select").nth(2);
    if (await reloadDisplaySelect.isVisible({ timeout: 3000 })) {
      await reloadDisplaySelect.selectOption({ value: String(round2Id) });
      await page.waitForTimeout(1000);
    }
  }
  const q6card = page.getByText("この1か月の体の不調", { exact: false }).first();
  if (await q6card.isVisible({ timeout: 8000 })) {
    await q6card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await shot(page, "5-5-01-question-results-q6-11.png");
    // 5-5-02: 心の健康（K6）— Q17 QCard のタイトル
    const k6card = page.getByText("心の健康（K6）", { exact: false }).first();
    if (await k6card.isVisible({ timeout: 8000 })) {
      await k6card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await shot(page, "5-5-02-question-results-q17-18.png");
    } else {
      skip("5-5-02-question-results-q17-18.png", "Q17 心の健康（K6）カードが見つからなかった");
    }
  } else {
    skip("5-5-01-question-results-q6-11.png", "Q6 カードが見つからなかった");
    skip("5-5-02-question-results-q17-18.png", "Q6 カードが見つからなかった");
  }

  // 5-6-01/5-6-02: 比較表示
  // 「比較実施回（前回）」セレクタはフィルター行の2番目のselect
  const prevRoundSelect = page.locator("select").nth(1);
  if (await prevRoundSelect.isVisible({ timeout: 3000 })) {
    // 第1回の ID 値で選択（ラベルではなく value を使う）
    await prevRoundSelect.selectOption({ value: String(round1Id) });
    await page.waitForTimeout(1200);
    await shot(page, "5-6-01-comparison-metrics.png", { clip: { x: 0, y: 64, width: 1280, height: 700 } });

    // 5-6-02: 痛みの部位（左右並び）
    await shootCard("5-6-02-comparison-pain-map.png", "痛みの部位");
  } else {
    skip("5-6-01-comparison-metrics.png", "比較実施回セレクタが見つからなかった");
    skip("5-6-02-comparison-pain-map.png", "比較実施回セレクタが見つからなかった");
  }
}

// ─── 第6章: CSVダウンロード ────────────────────────────────────────────────────

async function ch6Csv(page: Page) {
  console.log("\n【第6章】CSV出力");

  // results に戻り、比較モード解除 + demo + 第2回を選択
  await page.goto(`${BASE_URL}/results`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  const clientSelect = page.locator("select").first();
  if (await clientSelect.isVisible({ timeout: 3000 })) {
    await clientSelect.selectOption("demo");
    await page.waitForTimeout(600);
  }

  // 6-3-01: CSVダウンロードボタン
  const csvBtn = page.locator("button", { hasText: "CSVダウンロード" }).first();
  if (await csvBtn.isVisible({ timeout: 5000 })) {
    await csvBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await shot(page, "6-3-01-csv-download-button.png", { clip: { x: 0, y: 64, width: 1280, height: 180 } });
  } else {
    skip("6-3-01-csv-download-button.png", "CSVダウンロードボタンが表示されなかった（比較モード or 実施回未選択の可能性）");
  }
}

// ─── 第7章: データ管理 ────────────────────────────────────────────────────────

async function ch7DataManagement(page: Page, emptyRoundId: number) {
  console.log("\n【第7章】データ管理");

  await gotoSettings(page, "クライアント");
  await page.waitForTimeout(500);

  // 7-2-01: クライアント削除の確認フォーム（コード入力欄＋「完全に削除する」ボタン）
  // まず「削除」（小さい赤テキストボタン）を押して確認フォームを表示する
  const demoClientRow = page.locator("li").filter({ hasText: "見本株式会社" }).first();
  const clientSmallDeleteBtn = demoClientRow.isVisible({ timeout: 3000 })
    .then(v => v ? demoClientRow.locator("button", { hasText: "削除" }) : page.locator("button", { hasText: "削除" }).first());
  const smallDeleteBtn = await clientSmallDeleteBtn;
  if (await smallDeleteBtn.isVisible({ timeout: 3000 })) {
    await smallDeleteBtn.click();
    await page.waitForTimeout(500);
    await shot(page, "7-2-01-client-delete-dialog.png", { clip: { x: 0, y: 64, width: 1280, height: 500 } });
    // キャンセルして戻る
    const cancelBtn = page.locator("button", { hasText: "キャンセル" }).first();
    if (await cancelBtn.isVisible({ timeout: 3000 })) {
      await cancelBtn.click();
    }
    await page.waitForTimeout(300);
  } else {
    skip("7-2-01-client-delete-dialog.png", "「削除」ボタンが見つからなかった");
  }

  // 実施回タブへ移動してdemoを選択
  await gotoSettings(page, "実施回");
  await selectClientInTab(page, "demo");
  await page.waitForTimeout(600);

  // 7-2-02: 削除ボタンを押す前の一覧（回答がある実施回）
  await shot(page, "7-2-02-rounds-before-delete.png", { clip: { x: 0, y: 64, width: 1280, height: 500 } });

  // 7-2-03: 回答がある実施回の「削除」ボタンを押した直後
  // 第1回（回答16件あり）の削除ボタンをクリック
  const round1DeleteBtn = page.locator("button", { hasText: "削除" }).nth(0);
  if (await round1DeleteBtn.isVisible({ timeout: 3000 })) {
    await round1DeleteBtn.click();
    await page.waitForTimeout(1500); // 再フェッチ待ち
    await shot(page, "7-2-03-rounds-after-delete-attempt.png", { clip: { x: 0, y: 64, width: 1280, height: 500 } });
  } else {
    skip("7-2-03-rounds-after-delete-attempt.png", "削除ボタンが見つからなかった");
  }

  // 7-2-04: 再読み込み後の一覧（残っているか確認）
  await page.reload();
  await page.waitForLoadState("networkidle");
  await gotoSettings(page, "実施回");
  await selectClientInTab(page, "demo");
  await page.waitForTimeout(600);
  await shot(page, "7-2-04-rounds-after-reload.png", { clip: { x: 0, y: 64, width: 1280, height: 500 } });

  // 7-2-05: 回答0件の実施回を削除した後の一覧
  // 第3回（撮影用・0件）の削除ボタンをクリック
  const roundRows = page.locator("tr, li, div").filter({ hasText: "第3回 2027年9月" });
  const emptyRoundDeleteBtn = roundRows.locator("button", { hasText: "削除" }).first();
  if (await emptyRoundDeleteBtn.isVisible({ timeout: 3000 })) {
    await emptyRoundDeleteBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, "7-2-05-rounds-after-empty-delete.png", { clip: { x: 0, y: 64, width: 1280, height: 500 } });
  } else {
    // 残っているボタンの最後（最も新しい実施回＝空の実施回）
    const allDeleteBtns = page.locator("button", { hasText: "削除" });
    const count = await allDeleteBtns.count();
    if (count > 0) {
      await allDeleteBtns.last().click();
      await page.waitForTimeout(1500);
      await shot(page, "7-2-05-rounds-after-empty-delete.png", { clip: { x: 0, y: 64, width: 1280, height: 500 } });
    } else {
      skip("7-2-05-rounds-after-empty-delete.png", "削除ボタンが1つも見つからなかった");
    }
  }
}

// ─── メイン ────────────────────────────────────────────────────────────────────

async function main() {
  // 事前チェック
  if (!ADMIN_PASS) {
    console.error("SCREENSHOT_ADMIN_PASS が設定されていません");
    process.exit(1);
  }
  if (!CLIENT_PASS) {
    console.error("DEMO_ADMIN_PASS が設定されていません");
    process.exit(1);
  }

  // demo ラウンドIDを取得
  const { data: rounds } = await supabase
    .from("survey_rounds")
    .select("id, title")
    .eq("client_code", "demo")
    .order("id");
  const round1 = rounds?.find((r) => r.title.includes("第1回"));
  const round2 = rounds?.find((r) => r.title.includes("第2回"));
  const emptyRound = rounds?.find((r) => r.title.includes("第3回"));
  if (!round1 || !round2 || !emptyRound) {
    console.error("demo クライアントの実施回が見つかりません。seed-demo.ts を先に実行してください。");
    process.exit(1);
  }
  console.log(`demo ラウンドID: r1=${round1.id}, r2=${round2.id}, empty=${emptyRound.id}`);

  // ブラウザ起動
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "ja-JP",
  });
  const page = await context.newPage();

  try {
    await ch1Login(page);
    // ch2〜ch7 は system_admin でログイン済みの状態を引き継ぐ
    await login(page, ADMIN_EMAIL, ADMIN_PASS, "settings");
    await ch2Settings(page);
    await ch3Survey(page, round1.id, round2.id);
    // ch3のアンケート撮影後、設定画面に戻る
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await ch4Accounts(page);
    await ch5Results(page, round1.id, round2.id);
    await ch6Csv(page);
    await ch7DataManagement(page, emptyRound.id);
  } finally {
    await context.close();
    await browser.close();
  }

  // ─── 結果サマリー ─────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════");
  console.log(`撮影完了: ${taken.length} 件`);
  console.log(`スキップ: ${skipped.length} 件`);
  if (skipped.length > 0) {
    console.log("\nスキップ一覧:");
    for (const s of skipped) console.log(`  - ${s.file}: ${s.reason}`);
  }
  console.log("════════════════════════════════════════");

  // README用のデータをJSONで出力（後でREADMEに使う）
  fs.writeFileSync(
    path.join(OUT_DIR, "_results.json"),
    JSON.stringify({ taken, skipped }, null, 2),
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
