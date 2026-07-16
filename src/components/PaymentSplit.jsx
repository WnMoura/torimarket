import { Plus, Trash2 } from "lucide-react";
import { Field, IconButton } from "./ui";
import { FORMAS_PAGAMENTO } from "../lib/calc";
import { fmtMoney, num } from "../lib/format";

/**
 * Editor das formas de pagamento de uma venda. Uma linha por forma, cada uma com o valor.
 * Mostra quanto ainda falta alocar para fechar com o total; a validação real (soma == total)
 * é feita por quem usa, na hora de enviar.
 */
export function PaymentSplit({ pagamentos, setPagamentos, total }) {
  const somaPaga = pagamentos.reduce((soma, p) => soma + num(p.valor), 0);
  const restante = total - somaPaga;
  const fecha = Math.abs(restante) < 0.01;

  const atualizar = (indice, campo, valor) =>
    setPagamentos(pagamentos.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)));

  const adicionar = () =>
    setPagamentos([
      ...pagamentos,
      { forma: "Pix", valor: restante > 0 ? Number(restante.toFixed(2)) : 0 },
    ]);

  const remover = (indice) => setPagamentos(pagamentos.filter((_, i) => i !== indice));

  return (
    <Field label="Formas de pagamento" full>
      <div className="list">
        {pagamentos.map((parte, indice) => (
          <div className="sale-product-row" key={indice}>
            <select value={parte.forma} onChange={(e) => atualizar(indice, "forma", e.target.value)}>
              {FORMAS_PAGAMENTO.map((forma) => (
                <option key={forma}>{forma}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              value={parte.valor}
              onChange={(e) => atualizar(indice, "valor", e.target.value)}
            />
            {pagamentos.length > 1 ? (
              <IconButton danger title="Remover forma" onClick={() => remover(indice)}>
                <Trash2 />
              </IconButton>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <div className="list-row" style={{ marginTop: 10 }}>
        <button className="btn" type="button" onClick={adicionar}>
          <Plus size={16} /> Adicionar forma
        </button>
        <span className={fecha ? "positive" : "danger-text"}>
          {fecha ? "Fecha com o total" : `Falta alocar ${fmtMoney(restante)}`}
        </span>
      </div>
    </Field>
  );
}
