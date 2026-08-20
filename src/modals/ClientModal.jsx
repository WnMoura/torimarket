import { useState } from "react";
import { Field, Modal } from "../components/ui";

const CLIENTE_VAZIO = { nome: "", contato: "", email: "", preferencias: "", observacoes: "" };

const CAMPOS_TEXTO = [
  ["nome", "Nome"],
  ["contato", "Contato (WhatsApp/telefone)"],
  ["email", "Email"],
];

export function ClientModal({ cliente, salvarCliente, onClose }) {
  const [form, setForm] = useState({ ...CLIENTE_VAZIO, ...(cliente || {}) });

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    const salvou = await salvarCliente(form, cliente?.id || null);
    if (salvou) onClose();
  }

  return (
    <Modal title={cliente ? "Editar cliente" : "Novo cliente"} onClose={onClose}>
      <form className="grid" onSubmit={enviar}>
        <div className="form-grid">
          {CAMPOS_TEXTO.map(([campo, rotulo]) => (
            <Field key={campo} label={rotulo}>
              <input
                value={form[campo] || ""}
                onChange={alterar(campo)}
                required={campo === "nome"}
                type={campo === "email" ? "email" : "text"}
              />
            </Field>
          ))}

          <Field label="Preferências" full>
            <textarea value={form.preferencias || ""} onChange={alterar("preferencias")} />
          </Field>

          <Field label="Observações" full>
            <textarea value={form.observacoes || ""} onChange={alterar("observacoes")} />
          </Field>
        </div>

        <button className="btn primary full" type="submit">
          {cliente ? "Salvar cliente" : "Cadastrar"}
        </button>
      </form>
    </Modal>
  );
}
