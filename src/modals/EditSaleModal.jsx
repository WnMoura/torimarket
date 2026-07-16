import { useState } from "react";
import { Field, Modal } from "../components/ui";
import { PaymentSplit } from "../components/PaymentSplit";
import { salePayments } from "../lib/calc";
import { dayKey, fmtMoney, num } from "../lib/format";

/** Estado inicial a partir da venda: itens não entram aqui, só os metadados editáveis. */
function formInicial(venda) {
  return {
    cliente_id: venda.cliente_id || "",
    nome_cliente: venda.clientes?.nome || "",
    contato: venda.contato || "",
    data_venda: dayKey(venda.criado_em),
    observacoes: venda.observacoes || "",
    // Cópia rasa das partes para não editar o objeto que veio do store.
    pagamentos: salePayments(venda).map((p) => ({ forma: p.forma, valor: num(p.valor) })),
  };
}

export function EditSaleModal({ venda, clients, editarVenda, onError, onClose }) {
  const [form, setForm] = useState(() => formInicial(venda));
  const [enviando, setEnviando] = useState(false);

  const total = num(venda.total);
  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  async function enviar(evento) {
    evento.preventDefault();

    const somaPagamentos = form.pagamentos.reduce((soma, p) => soma + num(p.valor), 0);
    if (form.pagamentos.some((p) => num(p.valor) <= 0)) {
      onError("Cada forma de pagamento precisa de um valor maior que zero.");
      return;
    }
    if (Math.abs(somaPagamentos - total) > 0.01) {
      onError("As formas de pagamento precisam somar exatamente o total da venda.");
      return;
    }

    onError("");
    setEnviando(true);
    const editou = await editarVenda(venda.id, form);
    setEnviando(false);

    if (editou) onClose();
  }

  return (
    <Modal title="Editar venda" onClose={onClose}>
      <form onSubmit={enviar} className="grid">
        <div className="form-grid">
          <Field label="Cliente">
            <input
              list="clientes-edit"
              value={form.nome_cliente}
              onChange={(evento) => {
                const nome = evento.target.value;
                const cliente = clients.find((c) => c.nome === nome);
                setForm({
                  ...form,
                  nome_cliente: nome,
                  cliente_id: cliente?.id || "",
                  contato: cliente?.contato || form.contato,
                });
              }}
            />
            <datalist id="clientes-edit">
              {clients.map((cliente) => (
                <option key={cliente.id} value={cliente.nome} />
              ))}
            </datalist>
          </Field>

          <Field label="Contato">
            <input value={form.contato} onChange={alterar("contato")} />
          </Field>

          <Field label="Data da venda">
            <input type="date" max={dayKey()} value={form.data_venda} onChange={alterar("data_venda")} />
          </Field>

          <Field label="Observações" full>
            <textarea value={form.observacoes} onChange={alterar("observacoes")} />
          </Field>
        </div>

        <h2>Total: {fmtMoney(total)}</h2>

        <PaymentSplit
          pagamentos={form.pagamentos}
          setPagamentos={(novos) => setForm((atual) => ({ ...atual, pagamentos: novos }))}
          total={total}
        />

        <button className="btn primary full" type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </Modal>
  );
}
