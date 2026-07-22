import { useMemo, useState } from "react";
import { Plus, Tag } from "lucide-react";
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
import { dateBR, dayKey, dayLabel, fmtMoney, monthKey, monthLabel, num, today } from "../lib/format";

const BARRAS_POR_MODO = { Dia: 7, Semana: 8, Mês: 6 };
const ESTOQUE_BAIXO = 5;

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

/**
 * Primeiro uso: sem produto cadastrado não há o que medir, e mostrar quatro zeros não
 * ensina nada. A tela diz de onde o painel começa e leva para lá.
 */
function PainelVazio({ onIrParaProdutos }) {
  return (
    <div className="card primeiro-uso">
      <h2>Seu painel começa no primeiro produto</h2>
      <p>
        Cadastre um produto com custo e margem: o preço sugerido sai daí. A partir da primeira
        venda esta tela passa a mostrar faturamento, lucro e o que mais gira.
      </p>
      <button className="btn primary" type="button" onClick={onIrParaProdutos}>
        <Tag aria-hidden="true" /> Cadastrar produto
      </button>
    </div>
  );
}

/**
 * Dia sem venda: antes eram três cards de "R$ 0,00" e mais quatro linhas de forma de
 * pagamento zeradas. Uma linha honesta diz a mesma coisa, e o espaço vai para o que
 * ainda é verdade — o que está em estoque e o que precisa de reposição.
 */
function DiaSemVenda({ ultimaVenda, onNovaVenda }) {
  return (
    <div className="card dia-vazio">
      <div>
        <strong>Nenhuma venda hoje ainda</strong>
        <p className="muted">
          {ultimaVenda
            ? `A última foi em ${dateBR(ultimaVenda.criado_em)}, de ${fmtMoney(ultimaVenda.total)}.`
            : "Assim que a primeira for registrada, os números do dia aparecem aqui."}
        </p>
      </div>
      <button className="btn primary" type="button" onClick={onNovaVenda}>
        <Plus aria-hidden="true" /> Registrar venda
      </button>
    </div>
  );
}

export function Dashboard({
  sales,
  items,
  products,
  clients,
  settings,
  excluirVenda,
  onEditarVenda,
  onNovaVenda,
  onIrParaProdutos,
}) {
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

  // Só as formas que tiveram movimento: linha zerada não informa, só ocupa altura.
  const porFormaDePagamento = useMemo(
    () =>
      FORMAS_PAGAMENTO.map((forma) => ({
        forma,
        taxa: paymentRate(settings, forma),
        total: revenueByForma(vendasDeHoje, forma),
      }))
        .filter((linha) => linha.total > 0)
        .sort((a, b) => b.total - a.total),
    [vendasDeHoje, settings],
  );

  const semEstoque = products.filter((p) => num(p.estoque) <= ESTOQUE_BAIXO).length;
  const vendeuHoje = vendasDeHoje.length > 0;

  if (products.length === 0 && sales.length === 0) {
    return <PainelVazio onIrParaProdutos={onIrParaProdutos} />;
  }

  return (
    <div className="grid">
      {vendeuHoje ? (
        <section className="grid metrics">
          <Metric
            label="Vendas do dia"
            value={`${vendasDeHoje.length} ${vendasDeHoje.length === 1 ? "venda" : "vendas"}`}
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
            danger={totais.liquido < 0}
          />
        </section>
      ) : (
        <>
          <DiaSemVenda ultimaVenda={sales[0]} onNovaVenda={onNovaVenda} />
          <section className="grid metrics metrics-2">
            <Metric
              label="Valor em caixa (estoque)"
              value={fmtMoney(totais.valorEmEstoque)}
              sub={`${products.length} produtos`}
            />
            <Metric
              label="Precisam de reposição"
              value={`${semEstoque} ${semEstoque === 1 ? "produto" : "produtos"}`}
              sub={semEstoque ? "5 unidades ou menos" : "Nenhum no limite"}
            />
          </section>
        </>
      )}

      {/* Sem venda hoje, o quadro de formas de pagamento diria "nenhum recebimento" —
          que é o mesmo recado da linha lá de cima. Some, e o gráfico ocupa a largura. */}
      <section className={`grid ${vendeuHoje ? "main-grid" : ""}`}>
        <div className="card">
          <div className="toolbar">
            <h2>Vendas por período</h2>
            <Segment
              label="Agrupar o gráfico por"
              value={modo}
              setValue={setModo}
              options={["Dia", "Semana", "Mês"]}
            />
          </div>
          <BarChart bars={barras} />
        </div>

        {vendeuHoje && (
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
        )}
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
