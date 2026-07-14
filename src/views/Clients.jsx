import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Empty, IconButton } from "../components/ui";

export function Clients({ clients, excluir, onNovo, onEditar }) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const visiveis = clients.filter((cliente) =>
    `${cliente.nome} ${cliente.contato || ""} ${cliente.email || ""}`.toLowerCase().includes(termo),
  );

  async function remover(cliente) {
    if (!confirm(`Excluir "${cliente.nome}"? As vendas dele viram "cliente avulso".`)) return;
    await excluir("clientes", cliente.id);
  }

  return (
    <div className="card">
      <div className="toolbar">
        <h2>{visiveis.length} clientes</h2>
        <div className="filters">
          <input
            placeholder="Buscar nome, contato ou e-mail"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
          <button className="btn primary" type="button" onClick={onNovo}>
            Novo
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
