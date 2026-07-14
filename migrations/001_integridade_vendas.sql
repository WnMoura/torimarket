-- 001 — Integridade da venda
--
-- Aplique este arquivo no SQL Editor do Supabase ANTES de subir o frontend desta branch.
-- Ele é aditivo: não apaga tabela, não remove coluna, não reescreve dado existente.
--
-- O que muda:
--   1. itens_venda.custo_unitario  — congela o custo no momento da venda, para que
--      atualizar o cadastro de um produto pare de reescrever o lucro dos meses passados.
--   2. registrar_venda()           — grava venda, itens e baixa de estoque numa única
--      transação, recusando venda acima do estoque em vez de zerá-lo silenciosamente.
--   3. Índices e um CHECK de estoque não-negativo.
--
-- Nada aqui mexe nas policies de RLS: o acesso anônimo continua como está.

begin;

-- 1. Custo congelado ------------------------------------------------------------

alter table itens_venda add column if not exists custo_unitario numeric;

-- Vendas antigas não têm o custo da época registrado em lugar nenhum. O custo atual
-- do produto é a melhor aproximação disponível — e a partir de agora fica congelado.
update itens_venda iv
   set custo_unitario = p.custo
  from produtos p
 where iv.produto_id = p.id
   and iv.custo_unitario is null;

alter table itens_venda alter column custo_unitario set default 0;

-- 2. Venda transacional ---------------------------------------------------------

create or replace function public.registrar_venda(
  p_cliente_id      uuid,
  p_contato         text,
  p_forma_pagamento text,
  p_observacoes     text,
  p_itens           jsonb   -- [{ "produto_id": uuid, "quantidade": int }, ...]
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venda_id uuid;
  v_item     jsonb;
  v_produto  produtos%rowtype;
  v_qtd      integer;
  v_total    numeric := 0;
begin
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'A venda precisa ter ao menos um item.';
  end if;

  insert into vendas (cliente_id, contato, forma_pagamento, observacoes, total)
  values (p_cliente_id, p_contato, p_forma_pagamento, p_observacoes, 0)
  returning id into v_venda_id;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_qtd := (v_item->>'quantidade')::integer;

    if v_qtd is null or v_qtd <= 0 then
      raise exception 'Quantidade inválida na venda.';
    end if;

    -- Trava a linha do produto e só desconta se houver saldo. Sem o "and estoque >= v_qtd"
    -- duas vendas simultâneas do mesmo item se sobrescreveriam e uma das baixas sumiria.
    update produtos
       set estoque = estoque - v_qtd
     where id = (v_item->>'produto_id')::uuid
       and estoque >= v_qtd
    returning * into v_produto;

    if not found then
      raise exception 'Estoque insuficiente para o produto %.', (v_item->>'produto_id');
    end if;

    -- Preço e custo vêm do banco, não do navegador: o cliente não dita quanto pagou.
    insert into itens_venda (venda_id, produto_id, quantidade, preco_unitario, custo_unitario)
    values (v_venda_id, v_produto.id, v_qtd, v_produto.preco_final, v_produto.custo);

    v_total := v_total + v_qtd * v_produto.preco_final;
  end loop;

  update vendas set total = v_total where id = v_venda_id;

  return v_venda_id;
end;
$$;

grant execute on function public.registrar_venda(uuid, text, text, text, jsonb) to anon, authenticated;

-- 3. Guarda-corpos --------------------------------------------------------------

-- NOT VALID: passa a valer para toda escrita nova sem varrer (nem rejeitar) as linhas
-- que já existem. Se você já tiver produto com estoque negativo, ele continua lá.
alter table produtos drop constraint if exists estoque_nao_negativo;
alter table produtos add constraint estoque_nao_negativo check (estoque >= 0) not valid;

create index if not exists itens_venda_venda_id_idx  on itens_venda (venda_id);
create index if not exists itens_venda_produto_id_idx on itens_venda (produto_id);
create index if not exists vendas_criado_em_idx       on vendas (criado_em desc);
create index if not exists lancamentos_data_idx       on lancamentos (data desc);

commit;
