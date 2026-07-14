-- 002 — Arquivamento de produtos
--
-- Aplique DEPOIS da 001, no SQL Editor do Supabase. Também é aditiva e transacional.
--
-- Por que existe: itens_venda.produto_id é "on delete restrict", então excluir um produto
-- que já foi vendido sempre falhava — e fazer esse delete passar (com cascade) apagaria o
-- histórico de vendas e o DRE junto. Produto vendido passa a ser arquivado, não excluído.
--
-- O que muda:
--   1. produtos.ativo    — false esconde o produto das listas e da tela de venda.
--   2. registrar_venda() — passa a recusar venda de produto arquivado.
--   3. policy de delete no storage, para a foto sair junto na exclusão definitiva.

begin;

-- 1. Flag de arquivamento --------------------------------------------------------

alter table produtos add column if not exists ativo boolean not null default true;

create index if not exists produtos_ativo_idx on produtos (ativo);

-- 2. registrar_venda() recusa produto arquivado ----------------------------------

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

grant execute on function public.registrar_venda(uuid, text, text, text, jsonb) to anon, authenticated;

-- 3. Deixar a foto ser removida junto com o produto ------------------------------

-- O schema original criou policy de insert e select no bucket, mas não de delete —
-- então toda foto de produto excluído ficava órfã ocupando espaço no storage.
drop policy if exists "anon_delete_produtos" on storage.objects;

create policy "anon_delete_produtos"
on storage.objects for delete
using (bucket_id = 'produtos');

commit;
