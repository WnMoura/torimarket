import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Role, can } from "@/lib/permissions";

export type Membership = { userId: string; companyId: string; role: Role; name: string; email: string };

export async function getMembership(): Promise<Membership | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") throw new Error("MFA_REQUIRED");

  const { data } = await supabase
    .from("membros_empresa")
    .select("empresa_id, papel, perfis(nome, email)")
    .eq("usuario_id", user.id)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  if (!data || !["admin", "gerente", "vendedor"].includes(data.papel)) return null;
  const profile = Array.isArray(data.perfis) ? data.perfis[0] : data.perfis;
  return {
    userId: user.id,
    companyId: data.empresa_id,
    role: data.papel as Role,
    name: profile?.nome || user.email?.split("@")[0] || "Usuário",
    email: profile?.email || user.email || "",
  };
}

export async function requirePermission(permission: string) {
  const membership = await getMembership();
  if (!membership) throw new Error("UNAUTHORIZED");
  if (!can(membership.role, permission)) throw new Error("FORBIDDEN");
  return membership;
}
