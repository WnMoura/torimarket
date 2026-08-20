import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("products");
    const { id } = await params;
    const body = await request.json();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("produtos").update({
      nome: String(body.nome || "").trim().slice(0, 120),
      categoria: String(body.categoria || "").slice(0, 80),
      descricao: String(body.descricao || "").slice(0, 4000),
      preco_final: Math.max(0, Number(body.preco_final || 0)),
      custo: Math.max(0, Number(body.custo || 0)),
      atualizado_em: new Date().toISOString(),
    }).eq("id", id).eq("empresa_id", membership.companyId);
    if (error) throw error;
    return ok({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(_request);
    const membership = await requirePermission("products");
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("produtos").update({ arquivado_em: new Date().toISOString() }).eq("id", id).eq("empresa_id", membership.companyId);
    if (error) throw error;
    return ok({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
