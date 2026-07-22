import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Empty, IconButton } from "../components/ui";
import { useConfirmacao } from "../components/useConfirmacao";

export function Clients({ clients, excluir, onNovo, onEditar }) {
  const [busca, setBusca] = useState("");
  const [confirmar, dialogo] = useConfirmacao();

  const termo = busca.trim().toLowerCase();
  const visiveis = clients.filter((cliente) =>
    `${cliente.nome} ${cliente.contato || ""} ${cliente.email || ""}`.toLowerCase().includes(termo),
  );

  async function remover(cliente) {
    const confirmado = await confirmar({
      titulo: `Excluir ${cliente.nome}?`,
      mensagem:
        "O cadastro sai da lista, mas as vendas dele ficam — passam a aparecer como “cliente avulso”.",
      rotulo: "Excluir cliente",
    });
    if (confirmado) await excluir("clientes", cliente.id);
  }

  return (
    <div className="card">
      {dialogo}
      <div className="toolbar">
        <h2>{visiveis.length} clientes</h2>
        <div className="filters">
          <input
            type="search"
            aria-label="Buscar cliente por nome, contato ou e-mail"
            placeholder="Buscar cliente"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
          <button className="btn primary" type="button" onClick={onNovo}>
            <Plus aria-hidden="true" /> Novo cliente
          </button>
        </div>
      </div>

      <div className="list">
        {visiveis.length === 0 ? (
          <Empty>{clients.length ? "Nenhum cliente para essa busca." : "Nenhum cliente cadastrado."}</Empty>
        ) : (
          visiveis.map((cliente) => (
            <div className="list-row" key={cliente.id}>
              <div>
                <strong>{cliente.nome}</strong>
                <p className="muted">
                  {cliente.contato}
                  {cliente.email && ` - ${cliente.email}`}
                </p>
              </div>
              <div className="icon-actions">
                <IconButton title="Editar" onClick={() => onEditar(cliente)}>
                  <Pencil />
                </IconButton>
                <IconButton danger title="Excluir" onClick={() => remover(cliente)}>
                  <Trash2 />
                </IconButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
