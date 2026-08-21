import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const TORI_COMPANY_NAME = "Tori";
export const TORI_COMPANY_SLUG = "tori";
export type ProvisionedMembership = { companyId: string; role: "admin" | "gerente" | "vendedor" };

async function provisionWithAdmin(user: User): Promise<ProvisionedMembership> {
  const admin = createSupabaseAdminClient();
  const company = await admin.from("empresas").select("id").eq("slug", TORI_COMPANY_SLUG).maybeSingle();
  if (company.error) throw company.error;
  let companyId = company.data?.id || "";

  if (!company.data) {
    const legacy = await admin.from("empresas").select("id").eq("slug", "empresa-inicial").maybeSingle();
    if (legacy.error) throw legacy.error;
    if (legacy.data) {
      const renamed = await admin.from("empresas").update({ nome: TORI_COMPANY_NAME, slug: TORI_COMPANY_SLUG, ativo: true }).eq("id", legacy.data.id).select("id").single();
      if (renamed.error) throw renamed.error;
      companyId = renamed.data.id;
    } else {
      const created = await admin.from("empresas").insert({ nome: TORI_COMPANY_NAME, slug: TORI_COMPANY_SLUG, ativo: true }).select("id").single();
      if (created.error) throw created.error;
      companyId = created.data.id;
    }
  } else {
    const renamed = await admin.from("empresas").update({ nome: TORI_COMPANY_NAME, ativo: true }).eq("id", company.data.id);
    if (renamed.error) throw renamed.error;
  }

  const existing = await admin.from("membros_empresa").select("papel").eq("empresa_id", companyId).eq("usuario_id", user.id).maybeSingle();
  if (existing.error) throw existing.error;
  const activeMembers = await admin.from("membros_empresa").select("id", { count: "exact", head: true }).eq("empresa_id", companyId).eq("ativo", true);
  if (activeMembers.error) throw activeMembers.error;

  const isConfiguredAdmin = Boolean(env.initialAdminEmail && user.email?.toLowerCase() === env.initialAdminEmail);
  const role = existing.data?.papel || (isConfiguredAdmin || !activeMembers.count ? "admin" : "vendedor");
  const name = user.user_metadata?.name || user.email?.split("@")[0] || "Usuário Tori";

  const profile = await admin.from("perfis").upsert({ usuario_id: user.id, nome: name, email: user.email }).select().single();
  if (profile.error) throw profile.error;
  const deactivate = await admin.from("membros_empresa").update({ ativo: false }).eq("usuario_id", user.id).neq("empresa_id", companyId);
  if (deactivate.error) throw deactivate.error;
  const member = await admin.from("membros_empresa").upsert({ empresa_id: companyId, usuario_id: user.id, papel: role, ativo: true }, { onConflict: "empresa_id,usuario_id" });
  if (member.error) throw member.error;

  await admin.from("configuracoes").update({ nome_negocio: TORI_COMPANY_NAME, empresa_id: companyId }).or(`empresa_id.eq.${companyId},empresa_id.is.null`);
  return { companyId, role };
}

export async function ensureToriMembership(existingClient?: SupabaseClient): Promise<ProvisionedMembership | null> {
  const supabase = existingClient || await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") throw new Error("MFA_REQUIRED");

  if (env.supabaseSecretKey) return provisionWithAdmin(user);

  const { data, error } = await supabase.rpc("vincular_usuario_tori");
  if (error) throw new Error("Aplique a migration de empresa única da Tori ou configure a chave administrativa no servidor.");
  const provisioned = Array.isArray(data) ? data[0] : data;
  if (!provisioned?.empresa_id || !["admin", "gerente", "vendedor"].includes(provisioned.papel)) {
    throw new Error("O banco não confirmou o vínculo com a Tori.");
  }
  return { companyId: provisioned.empresa_id, role: provisioned.papel };
}

// Compatibilidade com imports anteriores durante o deploy gradual.
export const ensureInitialAdmin = ensureToriMembership;
