import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Field, IconButton } from "../components/ui";
import { salesIn, sumRevenue } from "../lib/calc";
import { dateBR, fmtMoney, monthKey, num, today } from "../lib/format";

const LANCAMENTO_VAZIO = { tipo: "saída", descricao: "", valor: 0, data: today() };

export function Cash({
  sales,
  cash,
  periodo,
  setPeriodo,
  salvarLancamento,
  excluir,
  excluirVenda,
}) {
  const [form, setForm] = useState(LANCAMENTO_VAZIO);

  const { linhas, saldo } = useMemo(() => {
    const vendasDoMes = salesIn(sales, periodo);
    const manuais = cash.filter((l) => monthKey(l.data) === periodo);

    const entradasManuais = manuais
      .filter((l) => l.tipo === "entrada")
      .reduce((total, l) => total + num(l.valor), 0);
    const saidasManuais = manuais
      .filter((l) => l.tipo === "saída")
      .reduce((total, l) => total + num(l.valor), 0);

    // Venda e lançamento manual convivem na mesma tabela, mas apagar cada um é
    // uma operação diferente: a venda precisa devolver o estoque, o lançamento não.
    const doMes = [
      ...vendasDoMes.map((venda) => ({
        chave: `venda-${venda.id}`,
        origem: "venda",
        id: venda.id,
        data: venda.criado_em,
        descricao: `Venda ${String(venda.id).slice(0, 8)}`,
        tipo: "entrada",
        valor: venda.total,
      })),
      ...manuais.map((lancamento) => ({
        chave: `lanc-${lancamento.id}`,
        origem: "lancamento",
        id: lancamento.id,
        data: lancamento.data,
        descricao: lancamento.descricao,
        tipo: lancamento.tipo,
        valor: lancamento.valor,
      })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data));

    return {
      linhas: doMes,
      saldo: sumRevenue(vendasDoMes) + entradasManuais - saidasManuais,
    };
  }, [sales, cash, periodo]);

  async function remover(linha) {
    if (linha.origem === "venda") {
      const confirmado = confirm(
        `Excluir a ${linha.descricao} (${fmtMoney(linha.valor)})?\n\n` +
          `Os produtos dela voltam para o estoque e ela some do DRE e dos relatórios. Não dá para desfazer.`,
      );
      if (confirmado) await excluirVenda(linha.id);
      return;
    }

    if (confirm(`Excluir o lançamento "${linha.descricao}"?`)) {
      await excluir("lancamentos", linha.id);
    }
  }

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    const salvou = await salvarLancamento(form);
    if (salvou) setForm({ ...LANCAMENTO_VAZIO, data: form.data });
  }

  return (
    <section className="grid two-col">
      <div className="card">
        <div className="toolbar">
          <h2>Fluxo de Caixa</h2>
          <input
            type="month"
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value)}
          />
        </div>

        <h2>Saldo do mês: {fmtMoney(saldo)}</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.chave}>
                  <td>{dateBR(linha.data)}</td>
                  <td>{linha.descricao}</td>
                  <td>{linha.tipo}</td>
                  <td>{fmtMoney(linha.valor)}</td>
                  <td>
                    <IconButton
                      danger
                      title={
                        linha.origem === "venda"
                          ? "Excluir venda (devolve o estoque)"
                          : "Excluir lançamento"
                      }
                      onClick={() => remover(linha)}
                    >
                      <Trash2 />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form className="card grid" onSubmit={enviar}>
        <h2>Novo lançamento</h2>

        <Field label="Tipo">
          <select value={form.tipo} onChange={alterar("tipo")}>
            <option>entrada</option>
            <option>saída</option>
          </select>
        </Field>

        <Field label="Descrição">
          <input value={form.descricao} onChange={alterar("descricao")} required />
        </Field>

        <Field label="Valor">
          <input type="number" step="0.01" value={form.valor} onChange={alterar("valor")} />
        </Field>

        <Field label="Data">
          <input type="date" value={form.data} onChange={alterar("data")} />
        </Field>

        <button className="btn primary" type="submit">
          Adicionar
        </button>
      </form>
    </section>
  );
}
