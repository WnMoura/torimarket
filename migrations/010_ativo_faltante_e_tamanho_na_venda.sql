-- 010 — Recupera produtos.ativo (a 002 não chegou a ser aplicada) e grava o tamanho vendido
--
-- Aplique DEPOIS da 009, no SQL Editor do Supabase. Aditiva e transacional.
--
-- Por que existe:
--   1. Registrar venda falhava com 'record "v_produto" has no field "ativo"'. A coluna
--      produtos.ativo, que a migração 002 deveria ter criado, não existe neste banco —
--      e registrar_venda() a consulta para recusar produto arquivado. Recriada aqui.
--   2. itens_venda.tamanho — o tamanho escolhido passa a ser gravado no item da venda,
--      para saber qual variação saiu (o estoque segue único por produto).
--
-- Nada é apagado: ativo nasce true para todo produto já cadastrado.

begin;

-- 1. Coluna que faltou da 002 -----------------------------------------------------

alter table produtos add column if not exists ativo boolean not null default true;

create index if not exists produtos_ativo_idx on produtos (ativo);

-- 2. Tamanho no item da venda -----------------------------------------------------

alter table itens_venda add column if not exists tamanho text;

-- 3. registrar_venda() grava o tamanho de cada item -------------------------------

drop function if exists public.registrar_venda(uuid, text, text, jsonb, jsonb, date);

create or replace function public.registrar_venda(
  p_cliente_id  uuid,
  p_contato     text,
  p_observacoes text,
  p_itens       jsonb,   -- [{ "produto_id": uuid, "quantidade": int, "tamanho": text }, ...]
  p_pagamentos  jsonb,   -- [{ "forma": text, "valor": numeric, "parcelas": int }, ...]
  p_data        date default null
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
  v_pago     numeric;
  v_forma    text;
  v_criado   timestamptz;
begin
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'A venda precisa ter ao menos um item.';
  end if;

  if p_pagamentos is null or jsonb_array_length(p_pagamentos) = 0 then
    raise exception 'A venda precisa ter ao menos uma forma de pagamento.';
  end if;

  if p_data > current_date then
    raise exception 'A data da venda não pode estar no futuro.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_pagamentos) e
     where (e->>'forma') not in ('Pix', 'Crédito', 'Débito', 'Dinheiro')
        or coalesce((e->>'valor')::numeric, 0) <= 0
  ) then
    raise exception 'Formas de pagamento inválidas.';
  end if;

  select coalesce(sum((e->>'valor')::numeric), 0) into v_pago
    from jsonb_array_elements(p_pagamentos) e;

  select (e->>'forma') into v_forma
    from jsonb_array_elements(p_pagamentos) e
   order by (e->>'valor')::numeric desc
   limit 1;

  -- Meio-dia UTC para a data cair no dia certo no Brasil (mesma regra da 008).
  v_criado := case
    when p_data is null or p_data = current_date then now()
    else (p_data + time '12:00')::timestamptz
  end;

  insert into vendas (cliente_id, contato, forma_pagamento, observacoes, total, criado_em, pagamentos)
  values (p_cliente_id, p_contato, v_forma, p_observacoes, 0, v_criado, p_pagamentos)
  returning id into v_venda_id;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_qtd := (v_item->>'quantidade')::integer;

    if v_qtd is null or v_qtd <= 0 then
      raise exception 'Quantidade inválida na venda.';
    end if;

    select * into v_produto from produtos where id = (v_item->>'produto_id')::uuid;

    if not found then
      raise exception 'Produto % não existe.', (v_item->>'produto_id');
    end if;

    if not v_produto.ativo then
      raise exception 'O produto "%" está arquivado e não pode ser vendido.', v_produto.nome;
    end if;

    update produtos
       set estoque = estoque - v_qtd
     where id = v_produto.id
       and estoque >= v_qtd
    returning * into v_produto;

    if not found then
      raise exception 'Estoque insuficiente para o produto "%".', v_produto.nome;
    end if;

    insert into itens_venda (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, tamanho)
    values (
      v_venda_id, v_produto.id, v_qtd, v_produto.preco_final, v_produto.custo,
      nullif(v_item->>'tamanho', '')
    );

    v_total := v_total + v_qtd * v_produto.preco_final;
  end loop;

  if abs(v_pago - v_total) > 0.01 then
    raise exception 'A soma das formas de pagamento (%) não bate com o total da venda (%).', v_pago, v_total;
  end if;

  update vendas set total = v_total where id = v_venda_id;

  return v_venda_id;
end;
$$;

grant execute on function public.registrar_venda(uuid, text, text, jsonb, jsonb, date) to authenticated;

commit;
