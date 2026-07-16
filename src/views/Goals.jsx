import { Plus, Trash2 } from "lucide-react";
import { Empty, IconButton } from "../components/ui";
import { goalIsMoney, goalProgress } from "../lib/calc";
import { dateBR, fmtInt, fmtMoney, num } from "../lib/format";

/** "Mensal", ou "12/12/2025 → 25/12/2025" quando a meta tem intervalo próprio. */
function rotuloPeriodo(meta) {
  if (meta.periodo === "Personalizado" && meta.data_inicio && meta.data_fim) {
    return `${dateBR(meta.data_inicio)} → ${dateBR(meta.data_fim)}`;
  }
  return meta.periodo;
}

export function Goals({ goals, sales, clients, excluir, onNova }) {
  return (
    <div className="card">
      <div className="toolbar">
        <h2>Metas</h2>
        <button className="btn primary" type="button" onClick={onNova}>
          <Plus size={17} /> Nova meta
        </button>
      </div>

      <div className="list">
        {goals.length === 0 ? (
          <Empty>Nenhuma meta definida.</Empty>
        ) : (
          goals.map((meta) => {
            const alcancado = goalProgress(meta, { vendas: sales, clientes: clients });
            const alvo = num(meta.valor_alvo);
            const percentual = Math.min(100, (alcancado / Math.max(1, alvo)) * 100);

            // Meta de "Número de vendas" ou "Novos clientes" é contagem, não dinheiro.
            const fmt = goalIsMoney(meta) ? fmtMoney : fmtInt;

            return (
              <div className="list-row" key={meta.id}>
                <div className="grow">
                  <strong>
                    {meta.tipo} - {rotuloPeriodo(meta)}
                  </strong>
                  <p className="muted">
                    {meta.descricao || "Sem descrição"} - {fmt(alcancado)} de {fmt(alvo)} (
                    {percentual.toFixed(0)}%)
                  </p>
                  <div className="progress">
                    <span style={{ "--progress": `${percentual}%` }} />
                  </div>
                </div>
                <IconButton danger title="Excluir" onClick={() => excluir("metas", meta.id)}>
                  <Trash2 />
                </IconButton>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
