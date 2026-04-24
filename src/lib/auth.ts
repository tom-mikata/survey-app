import { supabase } from "./supabase";

export type UserRole = "system_admin" | "client_admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  clientCode: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = user.app_metadata?.role as UserRole | undefined;
  if (!role) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    role,
    clientCode: role === "system_admin" ? null : (user.app_metadata?.client_code ?? null),
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
