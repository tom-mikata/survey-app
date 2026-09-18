import { NextResponse } from "next/server";
import { createAdminClient, requireSystemAdmin } from "@/lib/supabase-admin-server";

export const runtime = "nodejs";

export interface AdminAccount {
  id: string;
  email: string;
  role: "system_admin" | "client_admin" | null;
  clientCode: string | null;
}

/** #40: 発行済みアカウントの一覧表示 */
export async function GET() {
  const caller = await requireSystemAdmin();
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const accounts: AdminAccount[] = data.users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    role: (u.app_metadata?.role as AdminAccount["role"]) ?? null,
    clientCode: (u.app_metadata?.client_code as string | undefined) ?? null,
  }));

  return NextResponse.json({ accounts });
}

/** #40: 招待メールの送信（Supabase Auth invite by email） */
export async function POST(request: Request) {
  const caller = await requireSystemAdmin();
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = body.role === "system_admin" || body.role === "client_admin" ? body.role : null;
  const clientCode = typeof body.clientCode === "string" && body.clientCode.trim() ? body.clientCode.trim() : null;

  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "ロールを指定してください" }, { status: 400 });
  }
  if (role === "client_admin" && !clientCode) {
    return NextResponse.json({ error: "client_admin には所属クライアントの指定が必要です" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(invited.user.id, {
    app_metadata: {
      role,
      client_code: role === "client_admin" ? clientCode : null,
    },
  });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: invited.user.id });
}
