import { useMemo } from "react";
import { BarChart, BestSellers } from "../components/panels";
import { FORMAS_PAGAMENTO, sumRevenue } from "../lib/calc";
import { fmtMoney, monthKey, monthLabel, num } from "../lib/format";

export function Insights({ sales, items }) {
  const porMes = useMemo(() => {
    const buckets = new Map();

    for (const venda of sales) {
      const chave = monthKey(venda.criado_em);
      const bucket = buckets.get(chave) || { label: monthLabel(venda.criado_em), total: 0 };
      bucket.total += num(venda.total);
      buckets.set(chave, bucket);
    }

    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, valor]) => valor);
  }, [sales]);

  const ticketMedio = sales.length ? sumRevenue(sales) / sales.length : 0;

  return (
    <div className="grid main-grid">
      <BestSellers items={items} />

      <div className="card">
        <h2>Faturamento por mês</h2>
        <BarChart bars={porMes} />
        <p className="muted">Ticket médio: {fmtMoney(ticketMedio)}</p>
      </div>

      <div className="card">
        <h2>Vendas por forma de pagamento</h2>
        <div className="list">
          {FORMAS_PAGAMENTO.map((forma) => (
            <div className="list-row" key={forma}>
              <span>{forma}</span>
              <strong>{sales.filter((v) => v.forma_pagamento === forma).length}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
