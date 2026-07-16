import { useCallback, useEffect, useRef, useState } from "react";
import { hasSupabaseEnv, supabase } from "../supabase";
import { num } from "../lib/format";
import { caminhoDaFoto, produtoAtivo } from "../lib/storage.js";

export const CONFIG_PADRAO = {
  id: 1,
  nome_negocio: "Meu negócio",
  nome_usuario: "Usuário",
  logo_url: "",
  taxa_credito: 4.5,
  taxa_credito_2x: 0,
  taxa_credito_3x: 0,
  taxa_debito: 2,
  taxa_pix: 0,
  taxa_dinheiro: 0,
};

const VAZIO = {
  products: [],
  archivedProducts: [],
  clients: [],
  sales: [],
  items: [],
  goals: [],
  cash: [],
  settings: CONFIG_PADRAO,
};

const CAMPOS_PRODUTO = [
  "nome",
  "categoria",
  "foto_url",
  "custo",
  "custos_variaveis",
  "frete",
  "margem_desejada",
  "preco_sugerido",
  "preco_final",
  "estoque",
  "cor",
  "tamanhos",
  "descricao",
];

const CAMPOS_CLIENTE = ["nome", "contato", "email", "preferencias", "observacoes"];

const FOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Uma venda com 3 itens dispara vários eventos de realtime; sem o debounce, cada um recarregaria as 7 tabelas. */
const DEBOUNCE_REALTIME_MS = 500;

function apenasCampos(origem, campos) {
  return Object.fromEntries(campos.map((campo) => [campo, origem[campo] ?? null]));
}

const AVISO_MIGRACAO =
  "O banco ainda não tem as mudanças que esta versão exige. Aplique os arquivos de migrations/ em ordem no SQL Editor do Supabase.";

function mensagemDeErro(erro) {
  // PGRST202: função inexistente. PGRST204: coluna inexistente. Os dois querem dizer a mesma coisa aqui.
  if (erro?.code === "PGRST202" || erro?.code === "PGRST204") return AVISO_MIGRACAO;
  return erro?.message || "Erro inesperado ao falar com o Supabase.";
}

export function useStore() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(""); // recado esperado, não falha — ex: "produto arquivado em vez de excluído"
  const [data, setData] = useState(VAZIO);

  const timerRecarga = useRef(null);
  const sequencia = useRef(0);

  const load = useCallback(async () => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      setError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em um arquivo .env.local.");
      return;
    }

    const minhaVez = ++sequencia.current;
    setError("");

    try {
      const [produtos, clientes, vendas, itens, metas, config, lancamentos] = await Promise.all([
        supabase.from("produtos").select("*").order("criado_em", { ascending: false }),
        supabase.from("clientes").select("*").order("criado_em", { ascending: false }),
        supabase
          .from("vendas")
          .select("*, clientes(nome), itens_venda(*, produtos(nome))")
          .order("criado_em", { ascending: false }),
        supabase.from("itens_venda").select("*, produtos(nome, custo)"),
        supabase.from("metas").select("*").order("criado_em", { ascending: false }),
        supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle(),
        supabase.from("lancamentos").select("*").order("data", { ascending: false }),
      ]);

      for (const resposta of [produtos, clientes, vendas, itens, metas, config, lancamentos]) {
        if (resposta.error) throw resposta.error;
      }

      // Uma carga disparada depois desta já venceu a corrida — não sobrescreve o resultado dela.
      if (minhaVez !== sequencia.current) return;

      const todosProdutos = produtos.data || [];

      setData({
        products: todosProdutos.filter(produtoAtivo),
        archivedProducts: todosProdutos.filter((p) => !produtoAtivo(p)),
        clients: clientes.data || [],
        sales: vendas.data || [],
        items: itens.data || [],
        goals: metas.data || [],
        cash: lancamentos.data || [],
        settings: config.data || CONFIG_PADRAO,
      });
    } catch (erro) {
      if (minhaVez === sequencia.current) setError(mensagemDeErro(erro));
    } finally {
      if (minhaVez === sequencia.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (!hasSupabaseEnv) return undefined;

    const recarregarComDebounce = () => {
      clearTimeout(timerRecarga.current);
      timerRecarga.current = setTimeout(load, DEBOUNCE_REALTIME_MS);
    };

    const canal = supabase
      .channel("torimarket")
      .on("postgres_changes", { event: "*", schema: "public" }, recarregarComDebounce)
      .subscribe();

    return () => {
      clearTimeout(timerRecarga.current);
      supabase.removeChannel(canal);
    };
  }, [load]);

  const executar = useCallback(
    async (operacao) => {
      setAviso("");
      try {
        await operacao();
        await load();
        return true;
      } catch (erro) {
        setError(mensagemDeErro(erro));
        return false;
      }
    },
    [load],
  );

  async function subirFoto(arquivo, fotoAtual) {
    if (!arquivo) return fotoAtual || "";

    if (!arquivo.type.startsWith("image/")) throw new Error("O arquivo precisa ser uma imagem.");
    if (arquivo.size > FOTO_MAX_BYTES) throw new Error("A imagem passa de 5 MB.");

    // O nome original ia direto para o caminho do arquivo; um UUID + extensão limpa evita isso.
    const extensao = (arquivo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const caminho = `${crypto.randomUUID()}.${extensao}`;

    const { error: erro } = await supabase.storage
      .from("produtos")
      .upload(caminho, arquivo, { contentType: arquivo.type });
    if (erro) throw erro;

    return supabase.storage.from("produtos").getPublicUrl(caminho).data.publicUrl;
  }

  const acoes = {
    salvarProduto: (form, arquivo, editandoId) =>
      executar(async () => {
        const foto_url = await subirFoto(arquivo, form.foto_url);
        const payload = {
          ...apenasCampos(form, CAMPOS_PRODUTO),
          foto_url,
          custo: num(form.custo),
          custos_variaveis: num(form.custos_variaveis),
          frete: num(form.frete),
          margem_desejada: num(form.margem_desejada),
          preco_sugerido: num(form.preco_sugerido),
          preco_final: num(form.preco_final),
          estoque: Math.max(0, Math.floor(num(form.estoque))),
        };

        const { error: erro } = editandoId
          ? await supabase.from("produtos").update(payload).eq("id", editandoId)
          : await supabase.from("produtos").insert(payload);
        if (erro) throw erro;
      }),

    salvarCliente: (form, editandoId) =>
      executar(async () => {
        const payload = apenasCampos(form, CAMPOS_CLIENTE);
        const { error: erro } = editandoId
          ? await supabase.from("clientes").update(payload).eq("id", editandoId)
          : await supabase.from("clientes").insert(payload);
        if (erro) throw erro;
      }),

    salvarMeta: (form) =>
      executar(async () => {
        const personalizada = form.periodo === "Personalizado";
        const { error: erro } = await supabase.from("metas").insert({
          tipo: form.tipo,
          descricao: form.descricao || null,
          periodo: form.periodo,
          valor_alvo: num(form.valor_alvo),
          // Datas só valem para a meta personalizada; nas de período fixo ficam nulas.
          data_inicio: personalizada ? form.data_inicio || null : null,
          data_fim: personalizada ? form.data_fim || null : null,
        });
        if (erro) throw erro;
      }),

    salvarConfiguracoes: (form, arquivoLogo) =>
      executar(async () => {
        // Reaproveita o mesmo upload das fotos de produto; sem arquivo novo, mantém a logo atual.
        const logo_url = await subirFoto(arquivoLogo, form.logo_url);
        const { error: erro } = await supabase.from("configuracoes").upsert({
          id: 1,
          nome_negocio: form.nome_negocio,
          nome_usuario: form.nome_usuario,
          logo_url,
          taxa_credito: num(form.taxa_credito),
          taxa_credito_2x: num(form.taxa_credito_2x),
          taxa_credito_3x: num(form.taxa_credito_3x),
          taxa_debito: num(form.taxa_debito),
          taxa_pix: num(form.taxa_pix),
          taxa_dinheiro: num(form.taxa_dinheiro),
        });
        if (erro) throw erro;
      }),

    salvarLancamento: (form) =>
      executar(async () => {
        const { error: erro } = await supabase
          .from("lancamentos")
          .insert({ ...form, valor: num(form.valor) });
        if (erro) throw erro;
      }),

    /**
     * Venda inteira numa chamada só. O banco valida o estoque, congela preço e custo e
     * faz tudo numa transação — antes disso a baixa era um read-modify-write no navegador
     * que perdia concorrência e mascarava venda acima do estoque com Math.max(0, ...).
     */
    registrarVenda: (form) =>
      executar(async () => {
        let clienteId = form.cliente_id || null;

        if (!clienteId && form.nome_cliente.trim()) {
          const criado = await supabase
            .from("clientes")
            .insert({ nome: form.nome_cliente.trim(), contato: form.contato || null })
            .select()
            .single();
          if (criado.error) throw criado.error;
          clienteId = criado.data.id;
        }

        const { error: erro } = await supabase.rpc("registrar_venda", {
          p_cliente_id: clienteId,
          p_contato: form.contato || null,
          p_observacoes: form.observacoes || null,
          p_data: form.data_venda || null,
          p_itens: form.itens.map((item) => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
          })),
          p_pagamentos: form.pagamentos.map((p) => ({
            forma: p.forma,
            valor: num(p.valor),
            // Parcelas só fazem sentido no crédito; nas outras formas nem vão para o banco.
            ...(p.forma === "Crédito" ? { parcelas: num(p.parcelas) || 1 } : {}),
          })),
        });
        if (erro) throw erro;
      }),

    /**
     * Edita os metadados de uma venda já registrada — data, formas de pagamento,
     * cliente/contato e observações — sem tocar nos itens nem no estoque. O split precisa
     * continuar fechando com o total (que não muda aqui).
     */
    editarVenda: (vendaId, form) =>
      executar(async () => {
        let clienteId = form.cliente_id || null;

        if (!clienteId && form.nome_cliente?.trim()) {
          const criado = await supabase
            .from("clientes")
            .insert({ nome: form.nome_cliente.trim(), contato: form.contato || null })
            .select()
            .single();
          if (criado.error) throw criado.error;
          clienteId = criado.data.id;
        }

        const { error: erro } = await supabase.rpc("editar_venda", {
          p_venda_id: vendaId,
          p_cliente_id: clienteId,
          p_contato: form.contato || null,
          p_observacoes: form.observacoes || null,
          p_data: form.data_venda || null,
          p_pagamentos: form.pagamentos.map((p) => ({
            forma: p.forma,
            valor: num(p.valor),
            // Parcelas só fazem sentido no crédito; nas outras formas nem vão para o banco.
            ...(p.forma === "Crédito" ? { parcelas: num(p.parcelas) || 1 } : {}),
          })),
        });
        if (erro) throw erro;
      }),

    /**
     * Produto que nunca foi vendido some de vez, foto junto. Produto com histórico é
     * arquivado: o FK de itens_venda é "on delete restrict" e forçar o delete apagaria
     * as vendas dele — junto com o DRE dos meses em que apareceu.
     */
    excluirProduto: (produto) =>
      executar(async () => {
        const { error: erro } = await supabase.from("produtos").delete().eq("id", produto.id);

        // 23503: entrou numa venda entre a tela carregar e o clique. Arquiva em vez de falhar.
        if (erro?.code === "23503") {
          const { error: erroAoArquivar } = await supabase
            .from("produtos")
            .update({ ativo: false })
            .eq("id", produto.id);
          if (erroAoArquivar) throw erroAoArquivar;

          setAviso(
            `"${produto.nome}" já tem vendas registradas, então foi arquivado em vez de excluído. O histórico continua intacto.`,
          );
          return;
        }
        if (erro) throw erro;

        // Melhor esforço: o produto já saiu do banco, uma foto órfã não justifica falhar.
        const caminho = caminhoDaFoto(produto.foto_url);
        if (caminho) await supabase.storage.from("produtos").remove([caminho]);
      }),

    arquivarProduto: (id, arquivar) =>
      executar(async () => {
        const { error: erro } = await supabase
          .from("produtos")
          .update({ ativo: !arquivar })
          .eq("id", id);
        if (erro) throw erro;
      }),

    /** Estorna a venda: devolve ao estoque o que saiu e apaga venda + itens numa transação. */
    excluirVenda: (id) =>
      executar(async () => {
        const { error: erro } = await supabase.rpc("excluir_venda", { p_venda_id: id });
        if (erro) throw erro;
      }),

    excluir: (tabela, id) =>
      executar(async () => {
        const { error: erro } = await supabase.from(tabela).delete().eq("id", id);
        if (erro) throw erro;
      }),
  };

  return { ...data, loading, error, aviso, setError, setAviso, reload: load, ...acoes };
}
