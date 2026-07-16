import { useEffect, useRef, useState } from "react";
import { Field } from "../components/ui";

const TAXAS = [
  ["taxa_credito", "Taxa Crédito 1x (%)"],
  ["taxa_credito_2x", "Taxa Crédito 2x (%)"],
  ["taxa_credito_3x", "Taxa Crédito 3x (%)"],
  ["taxa_debito", "Taxa Débito (%)"],
  ["taxa_pix", "Taxa Pix (%)"],
  ["taxa_dinheiro", "Taxa Dinheiro (%)"],
];

export function SettingsView({ settings, salvarConfiguracoes }) {
  const [form, setForm] = useState(settings);
  const inputLogo = useRef(null);

  // O realtime pode trazer configurações novas enquanto a tela está aberta.
  useEffect(() => setForm(settings), [settings]);

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    const arquivoLogo = inputLogo.current?.files?.[0] || null;
    const salvou = await salvarConfiguracoes(form, arquivoLogo);
    if (salvou && inputLogo.current) inputLogo.current.value = "";
  }

  return (
    <form className="card grid" onSubmit={enviar}>
      <h2>Configurações</h2>

      <Field label="Logo do negócio" full>
        <div className="list-row logo-row">
          {form.logo_url ? (
            <img className="thumb" src={form.logo_url} alt="Logo do negócio" />
          ) : (
            <span className="muted">Nenhuma logo enviada</span>
          )}
          <input ref={inputLogo} className="grow" name="logo" type="file" accept="image/*" />
        </div>
      </Field>

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
