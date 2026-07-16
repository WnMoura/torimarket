import { asDate, dayKey, monthKey, monthLabel, num } from "./format.js";

export const FORMAS_PAGAMENTO = ["Pix", "Crédito", "Débito", "Dinheiro"];
export const TIPOS_META = ["Faturamento R$", "Número de vendas", "Novos clientes"];
export const PERIODOS_META = ["Diário", "Semanal", "Mensal", "Anual", "Personalizado"];

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

/**
 * Partes do pagamento da venda. Vendas gravadas antes do split (coluna pagamentos)
 * caem numa parte única com a forma e o total que elas já tinham.
 */
export const salePayments = (venda) =>
  Array.isArray(venda?.pagamentos) && venda.pagamentos.length
    ? venda.pagamentos
    : [{ forma: venda?.forma_pagamento, valor: num(venda?.total) }];

/** Taxa da venda somada parte a parte — cada forma tem a sua alíquota. */
export const saleFees = (venda, settings) =>
  salePayments(venda).reduce(
    (total, parte) => total + num(parte.valor) * (paymentRate(settings, parte.forma) / 100),
    0,
  );

export const sumFees = (vendas, settings) =>
  vendas.reduce((total, v) => total + saleFees(v, settings), 0);

/** Quanto entrou por uma forma de pagamento, considerando o split de cada venda. */
export const revenueByForma = (vendas, forma) =>
  vendas.reduce(
    (total, v) =>
      total + salePayments(v).filter((p) => p.forma === forma).reduce((s, p) => s + num(p.valor), 0),
    0,
  );

/** Resumo textual: "Pix" ou "Pix + Crédito" quando a venda foi dividida. */
export const paymentSummary = (venda) => {
  const partes = salePayments(venda);
  return partes.length === 1 ? partes[0].forma || "-" : partes.map((p) => p.forma).join(" + ");
};

/** `chave` com 7 caracteres filtra por mês (AAAA-MM); com 10, por dia (AAAA-MM-DD). */
export const salesIn = (vendas, chave) =>
  vendas.filter((v) => (chave.length === 7 ? monthKey(v.criado_em) : dayKey(v.criado_em)) === chave);

export function itemsOfSales(itens, vendas) {
  const ids = new Set(vendas.map((v) => v.id));
  return itens.filter((item) => ids.has(item.venda_id));
}

/**
 * Lucro líquido (receita − custo − taxas) de cada mês que teve venda, em ordem
 * cronológica, já com a variação percentual sobre o mês anterior. Base do gráfico de
 * tendência da aba Faturamento. `variacao` é null no primeiro mês e quando o mês
 * anterior fechou em zero — não há percentual comparável nesses casos.
 */
export function netProfitByMonth(vendas, itens, settings) {
  const meses = new Map();

  for (const venda of vendas) {
    const chave = monthKey(venda.criado_em);
    if (!meses.has(chave)) {
      meses.set(chave, { chave, label: monthLabel(venda.criado_em), vendas: [] });
    }
    meses.get(chave).vendas.push(venda);
  }

  const ordenados = [...meses.values()].sort((a, b) => a.chave.localeCompare(b.chave));

  let anterior = null;
  return ordenados.map((mes) => {
    const itensDoMes = itemsOfSales(itens, mes.vendas);
    const liquido = sumRevenue(mes.vendas) - sumCost(itensDoMes) - sumFees(mes.vendas, settings);
    const variacao =
      anterior === null || anterior === 0 ? null : ((liquido - anterior) / Math.abs(anterior)) * 100;
    anterior = liquido;
    return { label: mes.label, liquido, variacao };
  });
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

/**
 * Filtro de data da meta. Período "Personalizado" usa o intervalo [data_inicio, data_fim]
 * (fim inclusivo, até o último instante do dia). Os demais continuam sendo a janela
 * corrente do período — mês vigente, semana vigente etc.
 */
export function metaWindow(meta) {
  if (meta.periodo === "Personalizado" && meta.data_inicio && meta.data_fim) {
    const inicio = asDate(meta.data_inicio);
    const fim = asDate(meta.data_fim);
    fim.setHours(23, 59, 59, 999);
    return (registro) => {
      const quando = new Date(registro.criado_em);
      return quando >= inicio && quando <= fim;
    };
  }

  const inicio = periodStart(meta.periodo);
  return (registro) => new Date(registro.criado_em) >= inicio;
}

export function goalProgress(meta, { vendas, clientes }) {
  const dentroDaJanela = metaWindow(meta);
  const desde = (registros) => registros.filter(dentroDaJanela);

  if (meta.tipo === "Faturamento R$") return sumRevenue(desde(vendas));
  if (meta.tipo === "Número de vendas") return desde(vendas).length;
  return desde(clientes).length;
}

/** Metas de contagem não são dinheiro — formatá-las com fmtMoney vira "R$ 10,00 de R$ 50,00". */
export const goalIsMoney = (meta) => meta.tipo === "Faturamento R$";
