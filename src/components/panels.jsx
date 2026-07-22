import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { paymentSummary } from "../lib/calc";
import { dateBR, fmtMoney, num } from "../lib/format";
import { Empty, IconButton } from "./ui";
import { useConfirmacao } from "./useConfirmacao";
import { useMediaQuery } from "../hooks/useMediaQuery";

const nomesDosProdutos = (venda) =>
  (venda.itens_venda || [])
    .map((item) => item.produtos?.nome)
    .filter(Boolean)
    .join(", ") || "-";

/**
 * `compacto` força a lista mesmo no desktop: numa coluna lateral estreita a tabela
 * esconderia colunas do mesmo jeito que escondia no celular. Quem decide é quem
 * conhece a largura disponível — o layout da tela, não este componente.
 */
export function SalesTable({ title, sales, clients, excluirVenda, onEditarVenda, compacto }) {
  const temAcoes = Boolean(excluirVenda || onEditarVenda);
  const [confirmar, dialogo] = useConfirmacao();
  const emLista = useMediaQuery("(max-width: 760px)") || compacto;

  const nomePorId = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c.nome])),
    [clients],
  );

  const nomeDoCliente = (venda) =>
    venda.clientes?.nome || nomePorId[venda.cliente_id] || "Cliente avulso";

  async function remover(venda) {
    const confirmado = await confirmar({
      titulo: `Excluir a venda de ${fmtMoney(venda.total)}?`,
      mensagem:
        "Os produtos dela voltam para o estoque e ela some do DRE e dos relatórios. Não dá para desfazer.",
      rotulo: "Excluir venda",
    });
    if (confirmado) await excluirVenda(venda.id);
  }

  return (
    <div className="card">
      {dialogo}
      <h2>{title}</h2>
      {sales.length === 0 ? (
        <Empty>Nenhuma venda registrada.</Empty>
      ) : emLista ? (
        /*
         * No celular a tabela mostrava cliente, produto e valor — e empurrava data,
         * pagamento e as ações para fora da tela, atrás de uma rolagem que nada anuncia.
         * A lista põe o valor ao lado do nome e o resto embaixo, na ordem em que se lê.
         */
        <div className="stack-list">
          {sales.map((venda) => (
            <article className="stack-row" key={venda.id}>
              <div className="stack-head">
                <strong>{nomeDoCliente(venda)}</strong>
                <strong>{fmtMoney(venda.total)}</strong>
              </div>

              <p className="stack-produtos">{nomesDosProdutos(venda)}</p>

              <div className="stack-foot">
                <span className="muted">
                  {dateBR(venda.criado_em)} · {paymentSummary(venda)}
                </span>
                {temAcoes && (
                  <div className="icon-actions">
                    {onEditarVenda && (
                      <IconButton title="Editar venda" onClick={() => onEditarVenda(venda)}>
                        <Pencil />
                      </IconButton>
                    )}
                    {excluirVenda && (
                      <IconButton
                        danger
                        title="Excluir venda (devolve o estoque)"
                        onClick={() => remover(venda)}
                      >
                        <Trash2 />
                      </IconButton>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Produto</th>
                <th scope="col">Valor</th>
                <th scope="col">Pagamento</th>
                <th scope="col">Data</th>
                {temAcoes && (
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sales.map((venda) => (
                <tr key={venda.id}>
                  <td>{nomeDoCliente(venda)}</td>
                  <td>{nomesDosProdutos(venda)}</td>
                  <td>{fmtMoney(venda.total)}</td>
                  <td>{paymentSummary(venda)}</td>
                  <td>{dateBR(venda.criado_em)}</td>
                  {temAcoes && (
                    <td>
                      <div className="icon-actions">
                        {onEditarVenda && (
                          <IconButton title="Editar venda" onClick={() => onEditarVenda(venda)}>
                            <Pencil />
                          </IconButton>
                        )}
                        {excluirVenda && (
                          <IconButton
                            danger
                            title="Excluir venda (devolve o estoque)"
                            onClick={() => remover(venda)}
                          >
                            <Trash2 />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function BestSellers({ items }) {
  const ranking = useMemo(() => {
    // O nome vem do join em itens_venda, não da lista de produtos ativos: produto
    // arquivado continua tendo nome no ranking dos meses em que foi vendido.
    const porProduto = new Map();

    for (const item of items) {
      const nome = item.produtos?.nome || "Produto removido";
      porProduto.set(nome, (porProduto.get(nome) || 0) + num(item.quantidade));
    }

    return [...porProduto.entries()]
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);
  }, [items]);

  return (
    <div className="card">
      <h2>Mais vendidos</h2>
      <div className="list">
        {ranking.length === 0 ? (
          <Empty>Sem vendas registradas.</Empty>
        ) : (
          ranking.map((produto) => (
            <div className="list-row" key={produto.nome}>
              <span>{produto.nome}</span>
              <strong>{produto.qtd}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function BarChart({ bars }) {
  const valores = bars.map((b) => b.total);
  const maior = Math.max(...valores, 0);
  const temMovimento = maior > 0;

  return (
    <>
      {/*
       * A borda superior do gráfico é a altura do maior valor; sem rotulá-la, uma barra
       * alta não dizia se eram cinquenta reais ou cinco mil. No toque não há hover para
       * consultar, então esta é a única referência de escala que existe no celular.
       */}
      <p className="chart-scale">
        {temMovimento ? `máximo ${fmtMoney(maior)}` : "sem movimento no período"}
      </p>

      <div className="chart" style={{ "--bars": bars.length || 1 }}>
        {bars.map((barra) => {
          const vazia = barra.total <= 0;

          return (
            <div className="bar-wrap" key={barra.label}>
              <div
                className={`bar ${vazia ? "vazia" : ""}`}
                data-tip={`${barra.label} - ${fmtMoney(barra.total)}`}
                // Dia sem venda é um traço na linha de base, não uma cápsula de 8px
                // flutuando — aquilo lia como defeito de renderização, não como zero.
                style={vazia ? undefined : { height: `${(barra.total / maior) * 100}%` }}
              />
              <span className="bar-label">{barra.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
