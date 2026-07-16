import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { paymentSummary } from "../lib/calc";
import { dateBR, fmtMoney, num } from "../lib/format";
import { Empty, IconButton } from "./ui";

export function SalesTable({ title, sales, clients, excluirVenda, onEditarVenda }) {
  const temAcoes = Boolean(excluirVenda || onEditarVenda);

  const nomePorId = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c.nome])),
    [clients],
  );

  async function remover(venda) {
    const confirmado = confirm(
      `Excluir esta venda de ${fmtMoney(venda.total)}?\n\n` +
        `Os produtos dela voltam para o estoque e ela some do DRE e dos relatórios. Não dá para desfazer.`,
    );
    if (confirmado) await excluirVenda(venda.id);
  }

  return (
    <div className="card">
      <h2>{title}</h2>
      {sales.length === 0 ? (
        <Empty>Nenhuma venda registrada.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Data</th>
                {temAcoes && <th />}
              </tr>
            </thead>
            <tbody>
              {sales.map((venda) => (
                <tr key={venda.id}>
                  <td>{venda.clientes?.nome || nomePorId[venda.cliente_id] || "Cliente avulso"}</td>
                  <td>
                    {(venda.itens_venda || [])
                      .map((item) => item.produtos?.nome)
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
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
  const maior = Math.max(1, ...bars.map((b) => b.total));

  return (
    <div className="chart" style={{ "--bars": bars.length || 1 }}>
      {bars.map((barra) => (
        <div className="bar-wrap" key={barra.label}>
          <div
            className="bar"
            data-tip={`${barra.label} - ${fmtMoney(barra.total)}`}
            style={{ height: `${Math.max(5, (barra.total / maior) * 100)}%` }}
          />
          <span className="bar-label">{barra.label}</span>
        </div>
      ))}
    </div>
  );
}
