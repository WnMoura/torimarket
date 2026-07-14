import { dayKey, monthKey, num } from "./format.js";

export const FORMAS_PAGAMENTO = ["Pix", "Crédito", "Débito", "Dinheiro"];
export const TIPOS_META = ["Faturamento R$", "Número de vendas", "Novos clientes"];
export const PERIODOS_META = ["Diário", "Semanal", "Mensal", "Anual"];

const TAXA_DA_FORMA = {
  Crédito: "taxa_credito",
  Débito: "taxa_debito",
  Pix: "taxa_pix",
  Dinheiro: "taxa_dinheiro",
};

export const paymentRate = (settings, forma) => num(settings?.[TAXA_DA_FORMA[forma]]);

export const unitCost = (produto) =>
  num(produto?.custo) + num(produto?.custos_variaveis) + num(produto?.frete);

export function suggestedPrice(form) {
  const base = unitCost(form);
  const margem = Math.min(99, Math.max(0, num(form?.margem_desejada)));
  return base / (1 - margem / 100);
}

export function realMargin(form) {
  const preco = num(form?.preco_final);
  if (!preco) return 0;
  return ((preco - unitCost(form)) / preco) * 100;
}

/**
 * Custo do item na data da venda. Vendas gravadas antes da coluna custo_unitario
 * existir caem no custo atual do produto — a mesma aproximação que o backfill usou.
 */
export const itemCost = (item) => num(item?.custo_unitario ?? item?.produtos?.custo);

export const sumRevenue = (vendas) => vendas.reduce((total, v) => total + num(v.total), 0);

export const sumCost = (itens) =>
  itens.reduce((total, item) => total + num(item.quantidade) * itemCost(item), 0);

export const sumFees = (vendas, settings) =>
  vendas.reduce((total, v) => total + num(v.total) * (paymentRate(settings, v.forma_pagamento) / 100), 0);

/** `chave` com 7 caracteres filtra por mês (AAAA-MM); com 10, por dia (AAAA-MM-DD). */
export const salesIn = (vendas, chave) =>
  vendas.filter((v) => (chave.length === 7 ? monthKey(v.criado_em) : dayKey(v.criado_em)) === chave);

export function itemsOfSales(itens, vendas) {
  const ids = new Set(vendas.map((v) => v.id));
  return itens.filter((item) => ids.has(item.venda_id));
}

/** Início do período corrente — "Mensal" é o mês vigente, não os últimos 30 dias. */
export function periodStart(periodo, agora = new Date()) {
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const dia = agora.getDate();

  if (periodo === "Diário") return new Date(ano, mes, dia);
  if (periodo === "Semanal") {
    const inicio = new Date(ano, mes, dia);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7)); // recua até a segunda
    return inicio;
  }
  if (periodo === "Anual") return new Date(ano, 0, 1);
  return new Date(ano, mes, 1);
}

export function goalProgress(meta, { vendas, clientes }) {
  const inicio = periodStart(meta.periodo);
  const desde = (registros) => registros.filter((r) => new Date(r.criado_em) >= inicio);

  if (meta.tipo === "Faturamento R$") return sumRevenue(desde(vendas));
  if (meta.tipo === "Número de vendas") return desde(vendas).length;
  return desde(clientes).length;
}

/** Metas de contagem não são dinheiro — formatá-las com fmtMoney vira "R$ 10,00 de R$ 50,00". */
export const goalIsMoney = (meta) => meta.tipo === "Faturamento R$";
