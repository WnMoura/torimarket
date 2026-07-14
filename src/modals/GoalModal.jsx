import { useState } from "react";
import { Field, Modal } from "../components/ui";
import { PERIODOS_META, TIPOS_META } from "../lib/calc";

const META_VAZIA = { tipo: "Faturamento R$", descricao: "", periodo: "Mensal", valor_alvo: 0 };

export function GoalModal({ salvarMeta, onClose }) {
  const [form, setForm] = useState(META_VAZIA);

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    const salvou = await salvarMeta(form);
    if (salvou) onClose();
  }

  return (
    <Modal title="Nova meta" onClose={onClose}>
      <form className="grid" onSubmit={enviar}>
        <div className="form-grid">
          <Field label="Tipo">
            <select value={form.tipo} onChange={alterar("tipo")}>
              {TIPOS_META.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>
          </Field>

          <Field label="Período">
            <select value={form.periodo} onChange={alterar("periodo")}>
              {PERIODOS_META.map((periodo) => (
                <option key={periodo}>{periodo}</option>
              ))}
            </select>
          </Field>

          <Field label={form.tipo === "Faturamento R$" ? "Valor-alvo (R$)" : "Quantidade-alvo"}>
            <input
              type="number"
              step={form.tipo === "Faturamento R$" ? "0.01" : "1"}
              min="0"
              value={form.valor_alvo}
              onChange={alterar("valor_alvo")}
            />
          </Field>

          <Field label="Descrição" full>
            <textarea value={form.descricao} onChange={alterar("descricao")} />
          </Field>
        </div>

        <button className="btn primary full" type="submit">
          Criar meta
        </button>
      </form>
    </Modal>
  );
}
