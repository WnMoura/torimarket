-- 008 — Pagamento dividido e edição de venda
--
-- Aplique DEPOIS da 007, no SQL Editor do Supabase. Aditiva e transacional.
--
-- O que muda:
--   1. vendas.pagamentos (jsonb) — [{ "forma": text, "valor": numeric }, ...]. Permite
--      dividir a venda em várias formas (ex: parte no Pix, parte no crédito). As vendas
--      antigas são convertidas para um pagamento único com a forma que já tinham.
--   2. registrar_venda() passa a receber o split em vez de uma forma única. A soma das
--      partes precisa fechar com o total calculado a partir dos itens.
--   3. editar_venda() — nova: corrige data, formas de pagamento, cliente/contato e
--      observações de uma venda já registrada, SEM tocar em itens nem no estoque.
--
-- vendas.forma_pagamento continua existindo como resumo (a forma de maior valor), para o
-- que ainda lê essa coluna direto. Grants: authenticated, como desde a 004.

begin;

-- 1. Coluna de pagamentos + backfill --------------------------------------------

alter table vendas add column if not exists pagamentos jsonb;

update vendas
   set pagamentos = jsonb_build_array(jsonb_build_object('forma', forma_pagamento, 'valor', total))
 where pagamentos is null;

-- 2. registrar_venda() com pagamento dividido -----------------------------------

drop function if exists public.registrar_venda(uuid, text, text, text, jsonb, date);

create or replace function public.registrar_venda(
  p_cliente_id  uuid,
  p_contato     text,
  p_observacoes text,
  p_itens       jsonb,   -- [{ "produto_id": uuid, "quantidade": int }, ...]
  p_pagamentos  jsonb,   -- [{ "forma": text, "valor": numeric }, ...]
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

  -- Toda parte precisa de uma forma válida e um valor positivo.
  if exists (
    select 1 from jsonb_array_elements(p_pagamentos) e
     where (e->>'forma') not in ('Pix', 'Crédito', 'Débito', 'Dinheiro')
        or coalesce((e->>'valor')::numeric, 0) <= 0
  ) then
    raise exception 'Formas de pagamento inválidas.';
  end if;

  select coalesce(sum((e->>'valor')::numeric), 0) into v_pago
    from jsonb_array_elements(p_pagamentos) e;

  -- Forma de maior valor vira o resumo em forma_pagamento (coluna antiga, ainda lida).
  select (e->>'forma') into v_forma
    from jsonb_array_elements(p_pagamentos) e
   order by (e->>'valor')::numeric desc
   limit 1;

  -- Data escolhida só sobrescreve o now() quando é passada. Grava ao meio-dia UTC (não
  -- meia-noite): assim a venda cai no dia certo no Brasil, onde meia-noite UTC seria 21h
  -- do dia anterior. Meio-dia UTC fica no mesmo dia em qualquer fuso de -11 a +11.
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

    insert into itens_venda (venda_id, produto_id, quantidade, preco_unitario, custo_unitario)
    values (v_venda_id, v_produto.id, v_qtd, v_produto.preco_final, v_produto.custo);

    v_total := v_total + v_qtd * v_produto.preco_final;
  end loop;

  -- O total manda: o split informado tem que fechar com o preço real dos itens.
  if abs(v_pago - v_total) > 0.01 then
    raise exception 'A soma das formas de pagamento (%) não bate com o total da venda (%).', v_pago, v_total;
  end if;

  update vendas set total = v_total where id = v_venda_id;

  return v_venda_id;
end;
$$;

grant execute on function public.registrar_venda(uuid, text, text, jsonb, jsonb, date) to authenticated;

-- 3. editar_venda(): metadados, sem tocar em itens nem no estoque ----------------

create or replace function public.editar_venda(
  p_venda_id    uuid,
  p_cliente_id  uuid,
  p_contato     text,
  p_observacoes text,
  p_pagamentos  jsonb,
  p_data        date default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_venda vendas%rowtype;
  v_pago  numeric;
  v_forma text;
begin
  select * into v_venda from vendas where id = p_venda_id;
  if not found then
    raise exception 'Venda não encontrada.';
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

  -- Itens não mudam aqui, então o total é o mesmo: o split tem que fechar com ele.
  if abs(v_pago - v_venda.total) > 0.01 then
    raise exception 'A soma das formas de pagamento (%) não bate com o total da venda (%).', v_pago, v_venda.total;
  end if;

  select (e->>'forma') into v_forma
    from jsonb_array_elements(p_pagamentos) e
   order by (e->>'valor')::numeric desc
   limit 1;

  update vendas set
    cliente_id      = p_cliente_id,
    contato         = p_contato,
    observacoes     = p_observacoes,
    pagamentos      = p_pagamentos,
    forma_pagamento = v_forma,
    -- Data enviada normaliza para meio-dia UTC (mesmo motivo de fuso da registrar_venda);
    -- sem data, o horário original fica como está.
    criado_em = case
      when p_data is not null then (p_data + time '12:00')::timestamptz
      else criado_em
    end
  where id = p_venda_id;
end;
$$;

grant execute on function public.editar_venda(uuid, uuid, text, text, jsonb, date) to authenticated;

commit;
