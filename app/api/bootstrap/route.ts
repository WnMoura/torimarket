import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/auth";
import { apiError, ok } from "@/lib/http";

export async function GET() {
  try {
    const membership = await getMembership();
    if (!membership) throw new Error("UNAUTHORIZED");
    const supabase = await createSupabaseServerClient();
    const [company, products, variations, clients, sales, goals, cash, settings, movements] = await Promise.all([
      supabase.from("empresas").select("id, nome").eq("id", membership.companyId).single(),
      supabase.from("produtos").select("id, nome, categoria, foto_url, preco_final, custo, arquivado_em").eq("empresa_id", membership.companyId).is("arquivado_em", null).order("criado_em", { ascending: false }),
      supabase.from("variacoes_produto").select("id, produto_id, sku, tamanho, cor, estoque, estoque_minimo, ativo").eq("empresa_id", membership.companyId).eq("ativo", true).order("estoque", { ascending: true }),
      supabase.from("clientes").select("id, nome, contato, email, criado_em").eq("empresa_id", membership.companyId).is("arquivado_em", null).order("criado_em", { ascending: false }),
      supabase.from("vendas").select("id, total, forma_pagamento, status, criado_em, clientes(nome), itens_venda(quantidade, produtos(nome), variacao_id)").eq("empresa_id", membership.companyId).order("criado_em", { ascending: false }).limit(50),
      supabase.from("metas").select("id, tipo, descricao, periodo, valor_alvo, criado_em").eq("empresa_id", membership.companyId).order("criado_em", { ascending: false }),
      supabase.from("lancamentos").select("id, tipo, descricao, valor, data").eq("empresa_id", membership.companyId).order("data", { ascending: false }).limit(100),
      supabase.from("configuracoes").select("nome_negocio, nome_usuario, taxa_credito, taxa_debito, taxa_pix, taxa_dinheiro").eq("empresa_id", membership.companyId).maybeSingle(),
      supabase.from("movimentacoes_estoque").select("id, variacao_id, tipo, quantidade, saldo_novo, criado_em").eq("empresa_id", membership.companyId).order("criado_em", { ascending: false }).limit(100),
    ]);
    for (const result of [company, products, variations, clients, sales, goals, cash, settings, movements]) if (result.error) throw result.error;
    const productsWithUrls = await Promise.all((products.data || []).map(async (product) => {
      if (!product.foto_url || product.foto_url.startsWith("http")) return product;
      const signed = await supabase.storage.from("produtos").createSignedUrl(product.foto_url, 300);
      return { ...product, foto_url: signed.data?.signedUrl || null };
    }));
    return ok({ membership, company: company.data, products: productsWithUrls, variations: variations.data || [], clients: clients.data || [], sales: sales.data || [], goals: goals.data || [], cash: cash.data || [], settings: settings.data || {}, movements: movements.data || [] });
  } catch (error) {
    return apiError(error);
  }
}
