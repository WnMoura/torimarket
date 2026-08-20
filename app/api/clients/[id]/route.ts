import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("clients");
    const { id } = await params;
    const body = await request.json();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("clientes").update({
      nome: String(body.nome || "").trim().slice(0, 120),
      contato: String(body.contato || "").slice(0, 40),
      email: String(body.email || "").slice(0, 180),
      preferencias: String(body.preferencias || "").slice(0, 2000),
      observacoes: String(body.observacoes || "").slice(0, 4000),
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
    const membership = await requirePermission("clients");
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("clientes").update({ arquivado_em: new Date().toISOString() }).eq("id", id).eq("empresa_id", membership.companyId);
    if (error) throw error;
    return ok({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
