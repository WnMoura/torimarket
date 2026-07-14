import { useEffect, useState } from "react";
import { Field } from "../components/ui";

const TAXAS = [
  ["taxa_credito", "Taxa Crédito (%)"],
  ["taxa_debito", "Taxa Débito (%)"],
  ["taxa_pix", "Taxa Pix (%)"],
  ["taxa_dinheiro", "Taxa Dinheiro (%)"],
];

export function SettingsView({ settings, salvarConfiguracoes }) {
  const [form, setForm] = useState(settings);

  // O realtime pode trazer configurações novas enquanto a tela está aberta.
  useEffect(() => setForm(settings), [settings]);

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    await salvarConfiguracoes(form);
  }

  return (
    <form className="card grid" onSubmit={enviar}>
      <h2>Configurações</h2>

      <div className="form-grid">
        <Field label="Nome do negócio">
          <input value={form.nome_negocio || ""} onChange={alterar("nome_negocio")} />
        </Field>

        <Field label="Nome do usuário">
          <input value={form.nome_usuario || ""} onChange={alterar("nome_usuario")} />
        </Field>

        {TAXAS.map(([campo, rotulo]) => (
          <Field key={campo} label={rotulo}>
            <input type="number" step="0.01" value={form[campo] ?? 0} onChange={alterar(campo)} />
          </Field>
        ))}
      </div>

      <button className="btn primary full" type="submit">
        Salvar configurações
      </button>
    </form>
  );
}
