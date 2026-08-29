import { NextResponse } from "next/server";
import { createAdminClient, requireSystemAdmin } from "@/lib/supabase-admin-server";

export const runtime = "nodejs";

/** #40: ロール・所属クライアントの変更（app_metadata の更新） */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSystemAdmin();
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const role = body.role === "system_admin" || body.role === "client_admin" ? body.role : null;
  const clientCode = typeof body.clientCode === "string" && body.clientCode.trim() ? body.clientCode.trim() : null;

  if (!role) {
    return NextResponse.json({ error: "ロールを指定してください" }, { status: 400 });
  }
  if (role === "client_admin" && !clientCode) {
    return NextResponse.json({ error: "client_admin には所属クライアントの指定が必要です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    app_metadata: {
      role,
      client_code: role === "client_admin" ? clientCode : null,
    },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** #40: アカウントの削除 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await requireSystemAdmin();
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (id === caller.id) {
    return NextResponse.json({ error: "自分自身のアカウントは削除できません" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
