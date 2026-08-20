import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { parseBody, productSchema } from "@/lib/validation";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("products");
    const input = parseBody(productSchema, await request.json());
    const supabase = await createSupabaseServerClient();
    const product = await supabase.from("produtos").insert({
      empresa_id: membership.companyId,
      criado_por: membership.userId,
      nome: input.nome,
      categoria: input.categoria,
      descricao: input.descricao,
      custo: input.custo,
      preco_final: input.preco_final,
      margem_desejada: input.margem_desejada,
      estoque: input.estoque,
    }).select("id").single();
    if (product.error) throw product.error;
    const variation = await supabase.from("variacoes_produto").insert({
      empresa_id: membership.companyId,
      produto_id: product.data.id,
      sku: input.sku || `SKU-${product.data.id.slice(0, 8).toUpperCase()}`,
      tamanho: input.tamanho,
      cor: input.cor,
      estoque: input.estoque,
      estoque_minimo: input.estoque_minimo,
    }).select().single();
    if (variation.error) {
      await supabase.from("produtos").update({ arquivado_em: new Date().toISOString() }).eq("id", product.data.id);
      throw variation.error;
    }
    return ok({ product: product.data, variation: variation.data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
