import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** #40: service_role キーで動作する管理用クライアント。サーバー側専用（API Route内でのみ使用すること）。 */
export function createAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * #40: リクエスト元のCookieセッションから呼び出しユーザーを取得し、system_admin であることを検証する。
 * system_admin でない場合は null を返す（呼び出し側で401/403を返すこと）。
 */
export async function requireSystemAdmin(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // API Route内では読み取りのみのため何もしない
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.app_metadata?.role !== "system_admin") return null;

  return { id: user.id, email: user.email ?? "" };
}
