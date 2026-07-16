import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BestSellers, SalesTable } from "../components/panels";
import { Empty } from "../components/ui";
import { fmtMoney, num } from "../lib/format";

const ESTOQUE_BAIXO = 5;

function statusDoEstoque(produto) {
  const quantidade = num(produto.estoque);
  if (quantidade === 0) return "Sem estoque";
  if (quantidade <= ESTOQUE_BAIXO) return "Estoque baixo";
  return "Em estoque";
}

export function Stock({ products, sales, items, clients, onNovaVenda, excluirVenda, onEditarVenda }) {
  const [filtros, setFiltros] = useState({ categoria: "", status: "", ordem: "nome" });

  const categorias = useMemo(
    () => [...new Set(products.map((p) => p.categoria).filter(Boolean))],
    [products],
  );

  const visiveis = useMemo(
    () =>
      products
        .filter((p) => !filtros.categoria || p.categoria === filtros.categoria)
        .filter((p) => !filtros.status || statusDoEstoque(p) === filtros.status)
        .sort((a, b) =>
          filtros.ordem === "estoque"
            ? num(a.estoque) - num(b.estoque)
            : String(a.nome).localeCompare(String(b.nome)),
        ),
    [products, filtros],
  );

  const alterarFiltro = (campo) => (evento) =>
    setFiltros({ ...filtros, [campo]: evento.target.value });

  return (
    <section className="grid two-col">
      <div className="card">
        <div className="toolbar">
          <h2>Estoque ({visiveis.length})</h2>
          <button className="btn primary" type="button" onClick={onNovaVenda}>
            <Plus size={17} /> Registrar venda
          </button>
        </div>

        <div className="filters">
          <select value={filtros.categoria} onChange={alterarFiltro("categoria")}>
            <option value="">Todas categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria}>{categoria}</option>
            ))}
          </select>

          <select value={filtros.status} onChange={alterarFiltro("status")}>
            <option value="">Todos status</option>
            <option>Em estoque</option>
            <option>Estoque baixo</option>
            <option>Sem estoque</option>
          </select>

          <select value={filtros.ordem} onChange={alterarFiltro("ordem")}>
            <option value="nome">Nome</option>
            <option value="estoque">Estoque</option>
          </select>
        </div>

        {visiveis.length === 0 ? (
          <Empty>Nenhum produto para os filtros escolhidos.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Cor</th>
                  <th>Tamanhos</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((produto) => (
                  <tr key={produto.id}>
                    <td>{produto.nome}</td>
                    <td>{produto.categoria}</td>
                    <td>{produto.cor || "-"}</td>
                    <td>{produto.tamanhos || "-"}</td>
                    <td>{fmtMoney(produto.preco_final)}</td>
                    <td>{produto.estoque}</td>
                    <td>
                      <span className="status-pill">{statusDoEstoque(produto)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid">
        <BestSellers items={items} />
        <SalesTable
          title="Últimas vendas"
          sales={sales.slice(0, 5)}
          clients={clients}
          excluirVenda={excluirVenda}
          onEditarVenda={onEditarVenda}
        />
      </div>
    </section>
  );
}
