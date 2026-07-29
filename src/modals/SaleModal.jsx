import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, IconButton, Modal } from "../components/ui";
import { PaymentSplit } from "../components/PaymentSplit";
import { contatoDoCliente, selecionarCliente } from "../lib/calc";
import { fmtMoney, num, today } from "../lib/format";

const VENDA_VAZIA = {
  cliente_id: "",
  nome_cliente: "",
  contato: "",
  data_venda: today(),
  observacoes: "",
  produto_id: "",
  tamanho: "",
  quantidade: 1,
  itens: [],
  pagamentos: [{ forma: "Pix", valor: 0 }],
};

/** "P,M,G,GG" (campo livre do cadastro) vira a lista de opções do seletor. */
const tamanhosDoProduto = (produto) =>
  String(produto?.tamanhos || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

/** Mesmo produto em tamanhos diferentes são linhas diferentes do carrinho. */
const chaveDoItem = (item) => `${item.produto_id}-${item.tamanho || ""}`;

export function SaleModal({ products, clients, registrarVenda, onError, onClose }) {
  // today() no inicializador, não em VENDA_VAZIA: garante a data de hoje mesmo se a aba
  // ficou aberta virando o dia.
  const [form, setForm] = useState(() => ({ ...VENDA_VAZIA, data_venda: today() }));
  const [enviando, setEnviando] = useState(false);

  const produtoPorId = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  const total = form.itens.reduce((soma, item) => soma + item.quantidade * item.preco_unitario, 0);

  // Com uma forma só, o valor acompanha o total automaticamente; ao dividir, o usuário aloca à mão.
  useEffect(() => {
    setForm((atual) => {
      if (atual.pagamentos.length !== 1 || num(atual.pagamentos[0].valor) === total) return atual;
      return { ...atual, pagamentos: [{ ...atual.pagamentos[0], valor: total }] };
    });
  }, [total]);

  const tamanhosDisponiveis = tamanhosDoProduto(produtoPorId[form.produto_id]);

  function adicionarItem() {
    const produto = produtoPorId[form.produto_id];
    if (!produto) return;

    const opcoes = tamanhosDoProduto(produto);
    if (opcoes.length && !form.tamanho) {
      onError(`Escolha o tamanho de "${produto.nome}".`);
      return;
    }

    const quantidade = Math.max(1, Math.floor(num(form.quantidade)));
    const jaNoCarrinho = form.itens
      .filter((item) => item.produto_id === produto.id)
      .reduce((soma, item) => soma + item.quantidade, 0);

    // O banco recusaria a venda de qualquer jeito; barrar aqui evita a ida e volta.
    const disponivel = num(produto.estoque) - jaNoCarrinho;
    if (quantidade > disponivel) {
      onError(
        disponivel > 0
          ? `Estoque insuficiente: restam ${disponivel} unidade(s) de "${produto.nome}".`
          : `"${produto.nome}" já está todo no carrinho.`,
      );
      return;
    }

    onError("");
    setForm((atual) => {
      const itens = [...atual.itens];
      const novo = {
        produto_id: produto.id,
        nome: produto.nome,
        tamanho: atual.tamanho || "",
        quantidade,
        preco_unitario: num(produto.preco_final),
      };
      const existente = itens.findIndex((item) => chaveDoItem(item) === chaveDoItem(novo));

      if (existente >= 0) {
        itens[existente] = { ...itens[existente], quantidade: itens[existente].quantidade + quantidade };
      } else {
        itens.push(novo);
      }

      return { ...atual, produto_id: "", tamanho: "", quantidade: 1, itens };
    });
  }

  function removerItem(chave) {
    setForm((atual) => ({
      ...atual,
      itens: atual.itens.filter((item) => chaveDoItem(item) !== chave),
    }));
  }

  async function enviar(evento) {
    evento.preventDefault();

    if (!form.itens.length) {
      onError("Adicione ao menos um produto à venda.");
      return;
    }

    const somaPagamentos = form.pagamentos.reduce((soma, p) => soma + num(p.valor), 0);
    if (form.pagamentos.some((p) => num(p.valor) <= 0)) {
      onError("Cada forma de pagamento precisa de um valor maior que zero.");
      return;
    }
    if (Math.abs(somaPagamentos - total) > 0.01) {
      onError("As formas de pagamento precisam somar exatamente o total da venda.");
      return;
    }

    setEnviando(true);
    const registrou = await registrarVenda(form);
    setEnviando(false);

    if (registrou) onClose();
  }

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  return (
    <Modal title="Nova venda" onClose={onClose}>
      <form onSubmit={enviar} className="grid">
        <div className="form-grid">
          <Field label="Cliente">
            <input
              list="clientes"
              value={form.nome_cliente}
              onChange={(evento) =>
                setForm({
                  ...form,
                  ...selecionarCliente(clients, evento.target.value, form.contato),
                })
              }
            />
            <datalist id="clientes">
              {clients.map((cliente) => (
                <option key={cliente.id} value={cliente.nome}>
                  {contatoDoCliente(cliente)}
                </option>
              ))}
            </datalist>
          </Field>

          <Field label="Contato">
            <input value={form.contato} onChange={alterar("contato")} />
          </Field>

          <Field label="Produto">
            <select
              value={form.produto_id}
              onChange={(evento) =>
                // Troca de produto zera o tamanho: as opções são de outro produto agora.
                setForm({ ...form, produto_id: evento.target.value, tamanho: "" })
              }
            >
              <option value="">Selecione</option>
              {products
                .filter((produto) => num(produto.estoque) > 0)
                .map((produto) => (
                  <option value={produto.id} key={produto.id}>
                    {produto.nome} - {fmtMoney(produto.preco_final)} ({produto.estoque} em estoque)
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Tamanho">
            <select
              value={form.tamanho}
              onChange={alterar("tamanho")}
              disabled={!tamanhosDisponiveis.length}
            >
              <option value="">
                {tamanhosDisponiveis.length ? "Selecione" : "Sem tamanhos cadastrados"}
              </option>
              {tamanhosDisponiveis.map((tamanho) => (
                <option key={tamanho}>{tamanho}</option>
              ))}
            </select>
          </Field>

          <Field label="Quantidade" group>
            <div className="qty-row">
              <input
                type="number"
                min="1"
                aria-label="Quantidade"
                value={form.quantidade}
                onChange={alterar("quantidade")}
              />
              <button className="btn" type="button" onClick={adicionarItem}>
                <Plus aria-hidden="true" /> Adicionar
              </button>
            </div>
          </Field>

          <Field label="Data da venda">
            <input type="date" max={today()} value={form.data_venda} onChange={alterar("data_venda")} />
          </Field>

          <Field label="Observações" full>
            <textarea value={form.observacoes} onChange={alterar("observacoes")} />
          </Field>
        </div>

        <div className="list">
          {form.itens.map((item) => (
            <div className="list-row" key={chaveDoItem(item)}>
              <span className="grow">
                {item.nome}
                {item.tamanho && ` (${item.tamanho})`} x {item.quantidade}
              </span>
              <div className="icon-actions">
                <strong>{fmtMoney(item.quantidade * item.preco_unitario)}</strong>
                <IconButton danger title="Remover" onClick={() => removerItem(chaveDoItem(item))}>
                  <Trash2 />
                </IconButton>
              </div>
            </div>
          ))}
        </div>

        <p className="total-line">
          <span>Total</span>
          <strong>{fmtMoney(total)}</strong>
        </p>

        <PaymentSplit
          pagamentos={form.pagamentos}
          setPagamentos={(novos) => setForm((atual) => ({ ...atual, pagamentos: novos }))}
          total={total}
        />

        <button className="btn primary full" type="submit" disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar venda"}
        </button>
      </form>
    </Modal>
  );
}
