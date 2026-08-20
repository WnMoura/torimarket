-- 005 — Data da venda editável
--
-- Aplique DEPOIS da 004, no SQL Editor do Supabase. Aditiva e transacional.
--
-- Por que existe: registrar_venda() gravava criado_em = now() sem alternativa, então uma
-- venda lançada com atraso caía no dia errado — e todo relatório (painel, DRE, caixa,
-- insights) agrupa por criado_em. Agora a função aceita uma data opcional para lançar a
-- venda no dia em que ela realmente aconteceu.
--
-- O que muda:
--   1. registrar_venda() ganha o parâmetro p_data (date, opcional).
--        - p_data nulo ou igual a hoje  -> criado_em = now()  (mantém o horário exato,
--          preservando a ordenação das vendas do próprio dia).
--        - p_data no passado            -> criado_em = essa data.
--        - p_data no futuro             -> recusado.
--   2. A assinatura antiga (5 args) é removida para não ficar dois overloads convivendo.
--
-- Grants: só authenticated, como ficou a partir da 004. anon continua fora.

begin;

-- A versão de 5 argumentos sai de cena; a nova tem a data como 6º parâmetro opcional.
drop function if exists public.registrar_venda(uuid, text, text, text, jsonb);

create or replace function public.registrar_venda(
  p_cliente_id      uuid,
  p_contato         text,
  p_forma_pagamento text,
  p_observacoes     text,
  p_itens           jsonb,   -- [{ "produto_id": uuid, "quantidade": int }, ...]
  p_data            date default null
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
  v_criado   timestamptz;
begin
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'A venda precisa ter ao menos um item.';
  end if;

  if p_data > current_date then
    raise exception 'A data da venda não pode estar no futuro.';
  end if;

  -- Data escolhida só sobrescreve o now() quando é uma data passada: assim as vendas de
  -- hoje mantêm o horário real e continuam ordenadas entre si.
  v_criado := case
    when p_data is null or p_data = current_date then now()
    else p_data::timestamptz
  end;

  insert into vendas (cliente_id, contato, forma_pagamento, observacoes, total, criado_em)
  values (p_cliente_id, p_contato, p_forma_pagamento, p_observacoes, 0, v_criado)
  returning id into v_venda_id;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_qtd := (v_item->>'quantidade')::integer;

    if v_qtd is null or v_qtd <= 0 then
      raise exception 'Quantidade inválida na venda.';
    end if;

    -- Checado à parte só para o erro dizer a verdade: "arquivado" e "sem estoque"
    -- são coisas diferentes e o vendedor precisa saber qual das duas aconteceu.
    select * into v_produto from produtos where id = (v_item->>'produto_id')::uuid;

    if not found then
      raise exception 'Produto % não existe.', (v_item->>'produto_id');
    end if;

    if not v_produto.ativo then
      raise exception 'O produto "%" está arquivado e não pode ser vendido.', v_produto.nome;
    end if;

    -- Trava a linha e só desconta se houver saldo. Sem o "and estoque >= v_qtd", duas
    -- vendas simultâneas do mesmo item se sobrescreveriam e uma das baixas sumiria.
    update produtos
       set estoque = estoque - v_qtd
     where id = v_produto.id
       and estoque >= v_qtd
    returning * into v_produto;

    if not found then
      raise exception 'Estoque insuficiente para o produto "%".', v_produto.nome;
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

grant execute on function public.registrar_venda(uuid, text, text, text, jsonb, date) to authenticated;

commit;
