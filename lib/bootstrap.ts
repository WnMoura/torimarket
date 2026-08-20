import "server-only";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ensureInitialAdmin() {
  if (!env.initialAdminEmail || !env.supabaseSecretKey) return false;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== env.initialAdminEmail) return false;

  const admin = createSupabaseAdminClient();
  const company = await admin.from("empresas").select("id").eq("slug", "empresa-inicial").single();
  if (company.error) throw company.error;
  const profile = await admin.from("perfis").upsert({ usuario_id: user.id, nome: user.user_metadata?.name || user.email?.split("@")[0] || "Administrador", email: user.email }).select().single();
  if (profile.error) throw profile.error;
  const member = await admin.from("membros_empresa").upsert({ empresa_id: company.data.id, usuario_id: user.id, papel: "admin", ativo: true }, { onConflict: "empresa_id,usuario_id" });
  if (member.error) throw member.error;
  return true;
}
