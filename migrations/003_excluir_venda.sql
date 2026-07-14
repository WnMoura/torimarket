-- 003 — Exclusão de venda com devolução de estoque
--
-- Aplique DEPOIS da 002, no SQL Editor do Supabase. Aditiva e transacional.
--
-- itens_venda.venda_id já é "on delete cascade", então um delete direto na tabela vendas
-- levaria os itens junto — mas deixaria o estoque baixado, como se a mercadoria tivesse
-- saído. Estornar a venda e devolver o estoque precisa ser uma coisa só.

begin;

create or replace function public.excluir_venda(p_venda_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item itens_venda%rowtype;
begin
  if not exists (select 1 from vendas where id = p_venda_id) then
    raise exception 'Venda não encontrada.';
  end if;

  -- Devolve ao estoque exatamente o que saiu nesta venda. Produto arquivado também
  -- recebe de volta: ele continua existindo, só não aparece para venda nova.
  for v_item in select * from itens_venda where venda_id = p_venda_id loop
    update produtos
       set estoque = estoque + v_item.quantidade
     where id = v_item.produto_id;
  end loop;

  -- itens_venda sai por cascade.
  delete from vendas where id = p_venda_id;
end;
$$;

grant execute on function public.excluir_venda(uuid) to anon, authenticated;

commit;
