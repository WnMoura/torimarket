import { useMemo } from "react";
import { Empty, Metric } from "../components/ui";
import {
  itemsOfSales,
  netProfitByMonth,
  periodStart,
  salesIn,
  sumCost,
  sumRevenue,
} from "../lib/calc";
import { currentMonth, fmtMoney } from "../lib/format";

/** Últimos 6 meses do gráfico de tendência; o suficiente para ler a curva sem apertar as barras. */
const MESES_NO_GRAFICO = 6;

/**
 * Barras do lucro líquido mês a mês. Altura pelo valor absoluto (mês no vermelho também
 * aparece), cor pelo sinal, e o selo em cima mostra a variação sobre o mês anterior.
 */
function LucroLiquidoTrend({ meses }) {
  if (meses.length === 0) return <Empty>Ainda não há vendas para comparar.</Empty>;

  const maiorAbsoluto = Math.max(1, ...meses.map((mes) => Math.abs(mes.liquido)));

  return (
    <div className="chart" style={{ "--bars": meses.length }}>
      {meses.map((mes) => (
        <div className="bar-wrap" key={mes.label}>
          {mes.variacao !== null && (
            <span className={`bar-delta ${mes.variacao >= 0 ? "positive" : "danger-text"}`}>
              {mes.variacao >= 0 ? "▲" : "▼"} {Math.abs(mes.variacao).toFixed(0)}%
            </span>
          )}
          <div
            className={`bar ${mes.liquido < 0 ? "negativa" : ""}`}
            data-tip={`${mes.label} - ${fmtMoney(mes.liquido)}`}
            style={{
              // Teto em 80% deixa a faixa de cima livre para o selo de variação não estourar.
              height: `${Math.max(5, (Math.abs(mes.liquido) / maiorAbsoluto) * 80)}%`,
            }}
          />
          <span className="bar-label">{mes.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Faturamento({ sales, items, settings }) {
  const resumo = useMemo(() => {
    const inicioSemana = periodStart("Semanal");
    const vendasSemana = sales.filter((v) => new Date(v.criado_em) >= inicioSemana);

    const vendasMes = salesIn(sales, currentMonth());
    const itensMes = itemsOfSales(items, vendasMes);

    const receitaMes = sumRevenue(vendasMes);
    const custoMes = sumCost(itensMes);

    return {
      faturamentoSemanal: sumRevenue(vendasSemana),
      faturamentoMensal: receitaMes,
      lucroBruto: receitaMes - custoMes,
      ticketMedio: vendasMes.length ? receitaMes / vendasMes.length : 0,
      qtdVendasMes: vendasMes.length,
    };
  }, [sales, items]);

  const tendencia = useMemo(
    () => netProfitByMonth(sales, items, settings).slice(-MESES_NO_GRAFICO),
    [sales, items, settings],
  );

  return (
    <div className="grid">
      <section className="grid metrics">
        <Metric
          label="Faturamento semanal"
          value={fmtMoney(resumo.faturamentoSemanal)}
          sub="Semana atual (desde segunda)"
        />
        <Metric
          label="Faturamento mensal"
          value={fmtMoney(resumo.faturamentoMensal)}
          sub={`${resumo.qtdVendasMes} venda(s) no mês`}
        />
        <Metric
          label="Lucro bruto (mês)"
          value={fmtMoney(resumo.lucroBruto)}
          sub="Receita − custo dos produtos"
        />
        <Metric
          label="Ticket médio (mês)"
          value={fmtMoney(resumo.ticketMedio)}
          sub="Faturamento ÷ nº de vendas"
        />
      </section>

      <div className="card">
        <h2>Lucro líquido por mês</h2>
        <p className="muted" style={{ marginTop: "-8px" }}>
          Variação percentual sobre o mês anterior — verde subiu, vermelho caiu.
        </p>
        <LucroLiquidoTrend meses={tendencia} />
      </div>
    </div>
  );
}
