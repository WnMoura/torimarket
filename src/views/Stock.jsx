import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BestSellers, SalesTable } from "../components/panels";
import { Empty } from "../components/ui";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { fmtMoney, num } from "../lib/format";

const ESTOQUE_BAIXO = 5;

function statusDoEstoque(produto) {
  const quantidade = num(produto.estoque);
  if (quantidade === 0) return "Sem estoque";
  if (quantidade <= ESTOQUE_BAIXO) return "Estoque baixo";
  return "Em estoque";
}

/** A cor acompanha o rótulo; quem não distingue cor continua lendo o texto. */
const TOM_DO_STATUS = {
  "Sem estoque": "danger",
  "Estoque baixo": "warn",
  "Em estoque": "",
};

export function Stock({ products, sales, items, clients, onNovaVenda, excluirVenda, onEditarVenda }) {
  const [filtros, setFiltros] = useState({ categoria: "", status: "", ordem: "nome" });
  const ehMobile = useMediaQuery("(max-width: 760px)");

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
            <Plus aria-hidden="true" /> Registrar venda
          </button>
        </div>

        {/*
          O rótulo padrão de cada filtro é o nome do campo, não "todas as categorias":
          cabe em meia largura no celular e continua dizendo o que o controle faz.
          O nome completo vai no aria-label, para quem usa leitor de tela.
        */}
        <div className="filters">
          <select
            aria-label="Filtrar por categoria"
            value={filtros.categoria}
            onChange={alterarFiltro("categoria")}
          >
            <option value="">Categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria}>{categoria}</option>
            ))}
          </select>

          <select
            aria-label="Filtrar por status do estoque"
            value={filtros.status}
            onChange={alterarFiltro("status")}
          >
            <option value="">Status</option>
            <option>Em estoque</option>
            <option>Estoque baixo</option>
            <option>Sem estoque</option>
          </select>

          <select
            aria-label="Ordenar a lista"
            value={filtros.ordem}
            onChange={alterarFiltro("ordem")}
          >
            <option value="nome">Ordem: nome</option>
            <option value="estoque">Ordem: estoque</option>
          </select>
        </div>

        {visiveis.length === 0 ? (
          <Empty>Nenhum produto para os filtros escolhidos.</Empty>
        ) : ehMobile ? (
          /*
           * A tabela no celular mostrava produto, categoria, cor e tamanhos — e deixava
           * preço, estoque e status fora da tela. São exatamente os três que se abre esta
           * tela para ver. Aqui eles vêm primeiro; categoria e tamanhos descem para a
           * linha de apoio, e a pílula só aparece quando há algo a fazer.
           */
          <div className="stack-list">
            {visiveis.map((produto) => {
              const status = statusDoEstoque(produto);
              const tom = TOM_DO_STATUS[status];
              const apoio = [produto.categoria, produto.tamanhos, produto.cor]
                .filter(Boolean)
                .join(" · ");

              return (
                <article className="stack-row" key={produto.id}>
                  <div className="stack-head">
                    <strong>{produto.nome}</strong>
                    <strong>{fmtMoney(produto.preco_final)}</strong>
                  </div>

                  <div className="stack-foot">
                    <span className="muted">{apoio || "Sem categoria"}</span>
                    <span className="stack-estoque">
                      {tom ? (
                        <span className={`status-pill ${tom}`}>{status}</span>
                      ) : (
                        <span className="muted">em estoque</span>
                      )}
                      <strong>{produto.estoque}</strong>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Produto</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Cor</th>
                  <th scope="col">Tamanhos</th>
                  <th scope="col">Preço</th>
                  <th scope="col">Estoque</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((produto) => {
                  const status = statusDoEstoque(produto);

                  return (
                    <tr key={produto.id}>
                      <td>{produto.nome}</td>
                      <td>{produto.categoria}</td>
                      <td>{produto.cor || "-"}</td>
                      <td>{produto.tamanhos || "-"}</td>
                      <td>{fmtMoney(produto.preco_final)}</td>
                      <td>{produto.estoque}</td>
                      <td>
                        <span className={`status-pill ${TOM_DO_STATUS[status]}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid">
        <BestSellers items={items} />
        <SalesTable
          compacto
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
