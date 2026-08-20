import { z } from "zod";

export const productSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  categoria: z.string().trim().max(80).optional().default(""),
  descricao: z.string().max(4000).optional().default(""),
  preco_final: z.coerce.number().finite().nonnegative(),
  custo: z.coerce.number().finite().nonnegative(),
  margem_desejada: z.coerce.number().finite().min(0).max(99.99),
  estoque_minimo: z.coerce.number().int().min(0).max(100000),
  tamanho: z.string().trim().max(30).optional().default("Único"),
  cor: z.string().trim().max(40).optional().default("Padrão"),
  sku: z.string().trim().max(60).optional().default(""),
  estoque: z.coerce.number().int().min(0).max(100000),
});

export const clientSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  contato: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email().max(180).optional().or(z.literal("")),
  preferencias: z.string().max(2000).optional().default(""),
  observacoes: z.string().max(4000).optional().default(""),
});

export const saleSchema = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  nome_cliente: z.string().trim().max(120).optional().default(""),
  contato: z.string().trim().max(40).optional().default(""),
  forma_pagamento: z.enum(["Pix", "Crédito", "Débito", "Dinheiro"]),
  observacoes: z.string().max(2000).optional().default(""),
  itens: z.array(z.object({
    variacao_id: z.string().uuid(),
    quantidade: z.coerce.number().int().positive().max(1000),
  })).min(1).max(100),
});

export const cancelSaleSchema = z.object({ motivo: z.string().trim().min(5).max(500) });

export function parseBody<T>(schema: z.ZodType<T>, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
  return parsed.data;
}
