import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

const schema = z.object({ nome_negocio: z.string().trim().min(2).max(100), taxa_credito: z.coerce.number().min(0).max(100), taxa_debito: z.coerce.number().min(0).max(100), taxa_pix: z.coerce.number().min(0).max(100), taxa_dinheiro: z.coerce.number().min(0).max(100) });

export async function PATCH(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("settings");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new Error("Informe taxas entre 0 e 100%.");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("configuracoes").update({ ...parsed.data, empresa_id: membership.companyId }).eq("empresa_id", membership.companyId);
    if (error) throw error;
    return ok({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
