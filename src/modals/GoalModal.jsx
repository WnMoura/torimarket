import { useState } from "react";
import { Field, Modal } from "../components/ui";
import { PERIODOS_META, TIPOS_META } from "../lib/calc";

const META_VAZIA = {
  tipo: "Faturamento R$",
  descricao: "",
  periodo: "Mensal",
  valor_alvo: 0,
  data_inicio: "",
  data_fim: "",
};

export function GoalModal({ salvarMeta, onError, onClose }) {
  const [form, setForm] = useState(META_VAZIA);

  const personalizada = form.periodo === "Personalizado";

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  async function enviar(evento) {
    evento.preventDefault();

    if (personalizada) {
      if (!form.data_inicio || !form.data_fim) {
        onError("Informe a data de início e a de fim da meta personalizada.");
        return;
      }
      if (form.data_fim < form.data_inicio) {
        onError("A data de fim não pode ser anterior à de início.");
        return;
      }
    }

    onError("");
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

          {personalizada && (
            <>
              <Field label="Início">
                <input type="date" value={form.data_inicio} onChange={alterar("data_inicio")} />
              </Field>

              <Field label="Fim">
                <input
                  type="date"
                  min={form.data_inicio || undefined}
                  value={form.data_fim}
                  onChange={alterar("data_fim")}
                />
              </Field>
            </>
          )}

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
