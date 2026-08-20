import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { parseBody, saleSchema } from "@/lib/validation";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("sales");
    const input = parseBody(saleSchema, await request.json());
    const supabase = await createSupabaseServerClient();
    let clientId = input.cliente_id || null;
    if (!clientId && input.nome_cliente) {
      const created = await supabase.from("clientes").insert({ empresa_id: membership.companyId, criado_por: membership.userId, nome: input.nome_cliente, contato: input.contato }).select("id").single();
      if (created.error) throw created.error;
      clientId = created.data.id;
    }
    const { data, error } = await supabase.rpc("registrar_venda", {
      p_cliente_id: clientId,
      p_contato: input.contato,
      p_forma_pagamento: input.forma_pagamento,
      p_observacoes: input.observacoes,
      p_itens: input.itens,
    });
    if (error) throw error;
    return ok({ id: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
