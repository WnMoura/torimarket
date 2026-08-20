import { useMemo } from "react";
import { itemsOfSales, salesIn, sumCost, sumFees, sumRevenue } from "../lib/calc";
import { fmtMoney } from "../lib/format";

export function Dre({ sales, items, settings, periodo, setPeriodo }) {
  const linhas = useMemo(() => {
    const vendasDoMes = salesIn(sales, periodo);
    const itensDoMes = itemsOfSales(items, vendasDoMes);

    const receita = sumRevenue(vendasDoMes);
    // sumCost usa o custo congelado em itens_venda.custo_unitario — mexer no cadastro
    // do produto hoje não reescreve mais o lucro dos meses passados.
    const custos = sumCost(itensDoMes);
    const taxas = sumFees(vendasDoMes, settings);

    return [
      ["Receita Bruta", receita],
      ["Descontos", 0],
      ["Receita Líquida", receita],
      ["Custos", custos],
      ["Lucro Bruto", receita - custos],
      ["Despesas / Taxas", taxas],
      ["Lucro Líquido", receita - custos - taxas],
    ];
  }, [sales, items, settings, periodo]);

  return (
    <div className="card">
      <div className="toolbar">
        <h2>Demonstrativo de Resultado</h2>
        <input type="month" value={periodo} onChange={(evento) => setPeriodo(evento.target.value)} />
      </div>

      <div className="list">
        {linhas.map(([rotulo, valor]) => (
          <div className="list-row" key={rotulo}>
            <span>{rotulo}</span>
            <strong>{fmtMoney(valor)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
