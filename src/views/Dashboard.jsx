import { useMemo, useState } from "react";
import { BarChart, SalesTable } from "../components/panels";
import { Metric, Segment } from "../components/ui";
import {
  FORMAS_PAGAMENTO,
  itemsOfSales,
  paymentRate,
  revenueByForma,
  salesIn,
  sumCost,
  sumFees,
  sumRevenue,
} from "../lib/calc";
import { dayKey, dayLabel, fmtMoney, monthKey, monthLabel, num, today } from "../lib/format";

const BARRAS_POR_MODO = { Dia: 7, Semana: 8, Mês: 6 };

/** Monta os últimos N buckets a partir de hoje e joga cada venda no seu. Tudo em fuso local. */
function seriesDeVendas(sales, modo) {
  const buckets = new Map();

  for (let i = BARRAS_POR_MODO[modo] - 1; i >= 0; i--) {
    const data = new Date();
    if (modo === "Dia") data.setDate(data.getDate() - i);
    if (modo === "Semana") data.setDate(data.getDate() - i * 7);
    if (modo === "Mês") data.setMonth(data.getMonth() - i);

    const chave = modo === "Mês" ? monthKey(data) : dayKey(data);
    buckets.set(chave, {
      label: modo === "Mês" ? monthLabel(data) : dayLabel(data),
      total: 0,
    });
  }

  for (const venda of sales) {
    const chave = modo === "Mês" ? monthKey(venda.criado_em) : dayKey(venda.criado_em);
    const bucket = buckets.get(chave);
    if (bucket) bucket.total += num(venda.total);
  }

  return [...buckets.values()];
}

export function Dashboard({ sales, items, products, clients, settings, excluirVenda, onEditarVenda }) {
  const [modo, setModo] = useState("Dia");

  const vendasDeHoje = useMemo(() => salesIn(sales, today()), [sales]);

  const totais = useMemo(() => {
    const itensDeHoje = itemsOfSales(items, vendasDeHoje);
    const receita = sumRevenue(vendasDeHoje);
    const custo = sumCost(itensDeHoje);
    const taxas = sumFees(vendasDeHoje, settings);
    const valorEmEstoque = products.reduce(
      (total, p) => total + num(p.preco_final) * num(p.estoque),
      0,
    );

    return { receita, custo, taxas, bruto: receita - custo, liquido: receita - custo - taxas, valorEmEstoque };
  }, [vendasDeHoje, items, products, settings]);

  const barras = useMemo(() => seriesDeVendas(sales, modo), [sales, modo]);

  const porFormaDePagamento = FORMAS_PAGAMENTO.map((forma) => ({
    forma,
    taxa: paymentRate(settings, forma),
    total: revenueByForma(vendasDeHoje, forma),
  }));

  return (
    <div className="grid">
      <section className="grid metrics">
        <Metric
          label="Vendas do dia"
          value={`${vendasDeHoje.length} vendas`}
          sub={fmtMoney(totais.receita)}
        />
        <Metric
          label="Valor em caixa (estoque)"
          value={fmtMoney(totais.valorEmEstoque)}
          sub={`${products.length} produtos`}
        />
        <Metric label="Lucro bruto (dia)" value={fmtMoney(totais.bruto)} sub="Receita - custo" />
        <Metric
          label="Lucro líquido (dia)"
          value={fmtMoney(totais.liquido)}
          sub={`Taxas: ${fmtMoney(totais.taxas)}`}
          danger
        />
      </section>

      <section className="grid main-grid">
        <div className="card">
          <div className="toolbar">
            <h2>Vendas por período</h2>
            <Segment value={modo} setValue={setModo} options={["Dia", "Semana", "Mês"]} />
          </div>
          <BarChart bars={barras} />
        </div>

        <div className="card">
          <h2>Formas de pagamento (hoje)</h2>
          <div className="list">
            {porFormaDePagamento.map((linha) => (
              <div className="list-row" key={linha.forma}>
                <div>
                  <strong>{linha.forma}</strong>
                  <p className="muted">Taxa: {linha.taxa}%</p>
                </div>
                <strong>{fmtMoney(linha.total)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SalesTable
        title="Últimas vendas"
        sales={sales.slice(0, 10)}
        clients={clients}
        excluirVenda={excluirVenda}
        onEditarVenda={onEditarVenda}
      />
    </div>
  );
}
