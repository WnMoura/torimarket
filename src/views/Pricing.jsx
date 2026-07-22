import { useMemo, useRef, useState } from "react";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Empty, Field, IconButton } from "../components/ui";
import { useConfirmacao } from "../components/useConfirmacao";
import { installmentPrices, realMargin, suggestedPrice } from "../lib/calc";
import { fmtMoney, num } from "../lib/format";

const PRODUTO_VAZIO = {
  nome: "",
  categoria: "",
  foto_url: "",
  custo: 0,
  custos_variaveis: 0,
  frete: 0,
  margem_desejada: 40,
  preco_sugerido: 0,
  preco_final: 0,
  estoque: 0,
  cor: "",
  tamanhos: "P,M,G,GG",
  descricao: "",
};

const CAMPOS_NUMERICOS = [
  ["custo", "Custo (R$)"],
  ["custos_variaveis", "Custos Variáveis (R$)"],
  ["frete", "Frete (R$)"],
  ["margem_desejada", "Margem Desejada (%)"],
];

export function Pricing({
  products,
  archivedProducts,
  items,
  settings,
  salvarProduto,
  excluirProduto,
  arquivarProduto,
}) {
  const [form, setForm] = useState(PRODUTO_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, dialogo] = useConfirmacao();
  const inputFoto = useRef(null);

  // Produto que já saiu em alguma venda não pode ser excluído sem levar o histórico junto.
  const idsComVenda = useMemo(() => new Set(items.map((item) => item.produto_id)), [items]);

  const sugerido = suggestedPrice(form);
  // Base à vista para o parcelado: o preço final digitado, ou o sugerido enquanto ele está em branco.
  const parcelado = installmentPrices(num(form.preco_final) || sugerido, settings);
  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  function limpar() {
    setForm(PRODUTO_VAZIO);
    setEditandoId(null);
    if (inputFoto.current) inputFoto.current.value = "";
  }

  async function enviar(evento) {
    evento.preventDefault();
    const arquivo = inputFoto.current?.files?.[0] || null;

    // A foto pode demorar a subir; sem o trava-envio o duplo clique cadastra duas vezes.
    setEnviando(true);
    const salvou = await salvarProduto(
      {
        ...form,
        preco_sugerido: sugerido,
        // Preço final em branco cai no sugerido — é o comportamento que o formulário promete.
        preco_final: num(form.preco_final) || sugerido,
      },
      arquivo,
      editandoId,
    );
    setEnviando(false);

    if (salvou) limpar();
  }

  async function remover(produto) {
    if (idsComVenda.has(produto.id)) {
      const confirmado = await confirmar({
        titulo: `Arquivar ${produto.nome}?`,
        mensagem:
          "Este produto já foi vendido, então excluir levaria o histórico de vendas junto. Arquivado, ele sai das listas e da tela de venda, mas continua contando no DRE e nos relatórios. Dá para restaurar depois.",
        rotulo: "Arquivar produto",
      });
      if (!confirmado) return;

      const arquivou = await arquivarProduto(produto.id, true);
      if (arquivou && editandoId === produto.id) limpar();
      return;
    }

    const confirmado = await confirmar({
      titulo: `Excluir ${produto.nome}?`,
      mensagem: "A foto sai junto e não dá para desfazer. Este produto nunca foi vendido, então nenhum histórico se perde.",
      rotulo: "Excluir produto",
    });
    if (!confirmado) return;

    const excluiu = await excluirProduto(produto);
    if (excluiu && editandoId === produto.id) limpar();
  }

  return (
    <section className="grid two-col">
      {dialogo}
      <form className="card" onSubmit={enviar}>
        <div className="toolbar">
          <h2>{editandoId ? "Editar produto" : "Novo produto"}</h2>
          {editandoId && (
            <button className="btn" type="button" onClick={limpar}>
              Cancelar edição
            </button>
          )}
        </div>

        <div className="form-grid">
          <Field label="Nome do Produto">
            <input
              value={form.nome}
              placeholder="Ex: Legging Cintura Alta"
              onChange={alterar("nome")}
              required
            />
          </Field>

          <Field label="Categoria">
            <input
              value={form.categoria || ""}
              placeholder="Fitness, Vestido..."
              onChange={alterar("categoria")}
            />
          </Field>

          <Field label="Foto do Produto" full>
            <input ref={inputFoto} name="foto" type="file" accept="image/*" />
          </Field>

          {CAMPOS_NUMERICOS.map(([campo, rotulo]) => (
            <Field key={campo} label={rotulo}>
              <input type="number" step="0.01" value={form[campo]} onChange={alterar(campo)} />
            </Field>
          ))}

          <Field label="Preço Sugerido">
            <input readOnly value={fmtMoney(sugerido)} />
          </Field>

          <Field label="Preço Final">
            <input
              type="number"
              step="0.01"
              value={form.preco_final}
              onChange={alterar("preco_final")}
            />
          </Field>

          <Field label="Estoque Inicial">
            <input type="number" min="0" value={form.estoque} onChange={alterar("estoque")} />
          </Field>

          <Field label="Cor / Cores">
            <input
              value={form.cor || ""}
              placeholder="Ex: Preto, Rosa"
              onChange={alterar("cor")}
            />
          </Field>

          <Field label="Tamanhos / Variações">
            <input value={form.tamanhos || ""} onChange={alterar("tamanhos")} />
          </Field>

          <Field label="Descrição / Observações" full>
            <textarea value={form.descricao || ""} onChange={alterar("descricao")} />
          </Field>
        </div>

        <p className="muted">
          Margem real estimada: <strong>{realMargin(form).toFixed(1)}%</strong>
        </p>

        <div>
          <h3>Preço no cartão (à vista → parcelado)</h3>
          <p className="muted" style={{ marginTop: "-6px" }}>
            Valor a cobrar para receber o preço à vista líquido da taxa de crédito.
          </p>
          <div className="list">
            {parcelado.map((linha) => (
              <div className="list-row" key={linha.parcelas}>
                <div className="grow">
                  <strong>{linha.parcelas}x de {fmtMoney(linha.valorParcela)}</strong>
                  <p className="muted">Taxa {linha.parcelas}x: {num(linha.taxa).toFixed(2)}%</p>
                </div>
                <strong>{fmtMoney(linha.total)}</strong>
              </div>
            ))}
          </div>
        </div>

        <button className="btn primary full" type="submit" disabled={enviando}>
          {enviando
            ? "Salvando..."
            : editandoId
              ? "Salvar alterações"
              : "Cadastrar produto"}
        </button>
      </form>

      <div className="card">
        <div className="toolbar">
          <h2>Produtos cadastrados ({products.length})</h2>
          {archivedProducts.length > 0 && (
            <button
              className="btn"
              type="button"
              onClick={() => setMostrarArquivados((atual) => !atual)}
            >
              {mostrarArquivados ? "Ocultar" : "Ver"} arquivados ({archivedProducts.length})
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <Empty>Nenhum produto cadastrado.</Empty>
        ) : (
          <div className="list">
            {products.map((produto) => {
              const temVenda = idsComVenda.has(produto.id);

              return (
                <div className="list-row" key={produto.id}>
                  {produto.foto_url && (
                    <img
                      className="thumb"
                      src={produto.foto_url}
                      alt=""
                      width={46}
                      height={46}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="grow">
                    <strong>{produto.nome}</strong>
                    <p className="muted">
                      {produto.categoria || "Sem categoria"} - {fmtMoney(produto.preco_final)} -
                      estoque {produto.estoque}
                    </p>
                    {(produto.cor || produto.tamanhos) && (
                      <p className="muted">{[produto.cor, produto.tamanhos].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <div className="icon-actions">
                    <IconButton
                      title="Editar"
                      onClick={() => {
                        setEditandoId(produto.id);
                        setForm({ ...PRODUTO_VAZIO, ...produto });
                        if (inputFoto.current) inputFoto.current.value = "";
                      }}
                    >
                      <Pencil />
                    </IconButton>
                    <IconButton
                      danger
                      title={temVenda ? "Arquivar (já foi vendido)" : "Excluir"}
                      onClick={() => remover(produto)}
                    >
                      {temVenda ? <Archive /> : <Trash2 />}
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mostrarArquivados && (
          <>
            <h2>Arquivados ({archivedProducts.length})</h2>
            <p className="muted">
              Não aparecem na tela de venda nem no estoque, mas seguem contando no DRE e nos
              relatórios dos meses em que foram vendidos.
            </p>
            <div className="list">
              {archivedProducts.map((produto) => (
                <div className="list-row" key={produto.id}>
                  {produto.foto_url && (
                    <img
                      className="thumb"
                      src={produto.foto_url}
                      alt=""
                      width={46}
                      height={46}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="grow">
                    <strong>{produto.nome}</strong>
                    <p className="muted">
                      {produto.categoria || "Sem categoria"} - {fmtMoney(produto.preco_final)} -
                      estoque {produto.estoque}
                    </p>
                    {(produto.cor || produto.tamanhos) && (
                      <p className="muted">{[produto.cor, produto.tamanhos].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <div className="icon-actions">
                    <IconButton
                      title="Restaurar"
                      onClick={() => arquivarProduto(produto.id, false)}
                    >
                      <ArchiveRestore />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
