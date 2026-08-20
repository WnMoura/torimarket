-- 004 — Fechar o banco: exigir usuário autenticado
--
-- ⚠️ ESTA MIGRAÇÃO E O DEPLOY DO FRONTEND TÊM QUE SER FEITOS JUNTOS.
-- Hoje o app fala com o banco como `anon`. Ao aplicar isto, a versão que estiver no ar
-- para de carregar na hora. Aplique o SQL e suba o build com a tela de login em seguida.
--
-- ⚠️ ANTES DE APLICAR, DESLIGUE O CADASTRO PÚBLICO:
--   Supabase → Authentication → Sign In / Providers → Email → desmarque "Enable signup".
-- As policies abaixo liberam tudo para QUALQUER usuário autenticado. Com o signup aberto,
-- qualquer pessoa cria uma conta sozinha e entra — não adiantaria nada ter fechado o anon.
-- Crie os usuários à mão em Authentication → Users → Add user.
--
-- O que muda: as policies "anon_full_*" saem e entram equivalentes só para `authenticated`.
-- A leitura das fotos continua pública (o bucket é público e as imagens aparecem no app);
-- o que era escrita anônima no bucket passa a exigir login.

begin;

-- 1. Tabelas ---------------------------------------------------------------------

drop policy if exists "anon_full_produtos"      on produtos;
drop policy if exists "anon_full_clientes"      on clientes;
drop policy if exists "anon_full_vendas"        on vendas;
drop policy if exists "anon_full_itens_venda"   on itens_venda;
drop policy if exists "anon_full_metas"         on metas;
drop policy if exists "anon_full_configuracoes" on configuracoes;
drop policy if exists "anon_full_lancamentos"   on lancamentos;

create policy "auth_full_produtos"      on produtos      for all to authenticated using (true) with check (true);
create policy "auth_full_clientes"      on clientes      for all to authenticated using (true) with check (true);
create policy "auth_full_vendas"        on vendas        for all to authenticated using (true) with check (true);
create policy "auth_full_itens_venda"   on itens_venda   for all to authenticated using (true) with check (true);
create policy "auth_full_metas"         on metas         for all to authenticated using (true) with check (true);
create policy "auth_full_configuracoes" on configuracoes for all to authenticated using (true) with check (true);
create policy "auth_full_lancamentos"   on lancamentos   for all to authenticated using (true) with check (true);

-- 2. Storage ---------------------------------------------------------------------

drop policy if exists "anon_upload_produtos" on storage.objects;
drop policy if exists "anon_delete_produtos" on storage.objects;

create policy "auth_upload_produtos"
on storage.objects for insert to authenticated
with check (bucket_id = 'produtos');

create policy "auth_delete_produtos"
on storage.objects for delete to authenticated
using (bucket_id = 'produtos');

-- "anon_read_produtos" (select) fica de pé de propósito: o bucket é público e as fotos
-- precisam carregar no <img>. São UUIDs, não são adivinháveis.

-- 3. Funções ---------------------------------------------------------------------

-- registrar_venda e excluir_venda são `security invoker`: rodam com a permissão de quem
-- chama, então já respeitariam as policies acima. Tirar o grant do anon fecha a porta
-- de vez, em vez de deixá-la destrancada contando com o RLS.
revoke execute on function public.registrar_venda(uuid, text, text, text, jsonb) from anon;
revoke execute on function public.excluir_venda(uuid) from anon;

grant execute on function public.registrar_venda(uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.excluir_venda(uuid) to authenticated;

commit;
