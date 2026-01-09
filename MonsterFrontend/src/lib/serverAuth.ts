import { supabase } from "./supabase";

export async function requireRole(
  allowedRoles: Array<"admin" | "seller" | "buyer">
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data, error } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", session.user.id)
    .single();

  if (error || !data) return false;
  return allowedRoles.includes(data.user_type);
}