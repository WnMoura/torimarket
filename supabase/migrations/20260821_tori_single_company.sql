-- Tori: consolidação single-tenant e vínculo automático após MFA.
-- Execute depois de 20260820_secure_gestor_pro.sql, primeiro em homologação.

begin;

do $$
declare
  tori_company uuid;
  legacy_company uuid;
begin
  select id into tori_company from public.empresas where slug = 'tori' limit 1;
  select id into legacy_company from public.empresas where slug = 'empresa-inicial' limit 1;

  if tori_company is null and legacy_company is not null then
    update public.empresas
      set nome = 'Tori', slug = 'tori', ativo = true, atualizado_em = now()
      where id = legacy_company
      returning id into tori_company;
  elsif tori_company is null then
    insert into public.empresas (nome, slug, ativo)
      values ('Tori', 'tori', true)
      returning id into tori_company;
  else
    update public.empresas set nome = 'Tori', ativo = true, atualizado_em = now() where id = tori_company;
  end if;

  if legacy_company is not null and legacy_company <> tori_company then
    update public.produtos set empresa_id = tori_company where empresa_id = legacy_company;
    update public.clientes set empresa_id = tori_company where empresa_id = legacy_company;
    update public.vendas set empresa_id = tori_company where empresa_id = legacy_company;
    update public.itens_venda set empresa_id = tori_company where empresa_id = legacy_company;
    update public.metas set empresa_id = tori_company where empresa_id = legacy_company;
    update public.lancamentos set empresa_id = tori_company where empresa_id = legacy_company;
    update public.configuracoes set empresa_id = tori_company, nome_negocio = 'Tori' where empresa_id = legacy_company;
    update public.variacoes_produto set empresa_id = tori_company where empresa_id = legacy_company;
    update public.movimentacoes_estoque set empresa_id = tori_company where empresa_id = legacy_company;
    update public.auditoria set empresa_id = tori_company where empresa_id = legacy_company;

    insert into public.membros_empresa (empresa_id, usuario_id, papel, ativo)
    select tori_company, usuario_id, papel, ativo
      from public.membros_empresa
      where empresa_id = legacy_company
    on conflict (empresa_id, usuario_id) do update
      set papel = excluded.papel, ativo = excluded.ativo;

    delete from public.membros_empresa where empresa_id = legacy_company;
    update public.empresas set ativo = false where id = legacy_company;
  end if;

  update public.configuracoes set nome_negocio = 'Tori', empresa_id = tori_company;
end $$;

create or replace function public.vincular_usuario_tori()
returns table (empresa_id uuid, papel public.app_role)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user uuid := auth.uid();
  tori_company uuid;
  assigned_role public.app_role;
  profile_name text;
  profile_email text;
begin
  if current_user is null then raise exception 'Sessão inválida'; end if;
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then raise exception 'MFA obrigatório'; end if;

  select id into tori_company from public.empresas where slug = 'tori' and ativo = true limit 1;
  if tori_company is null then raise exception 'Empresa Tori não configurada'; end if;

  select m.papel into assigned_role
    from public.membros_empresa m
    where m.empresa_id = tori_company and m.usuario_id = current_user
    limit 1;

  if assigned_role is null then
    if not exists (select 1 from public.membros_empresa where empresa_id = tori_company and ativo = true) then
      assigned_role := 'admin';
    else
      assigned_role := 'vendedor';
    end if;
  end if;

  select
    coalesce(nullif(raw_user_meta_data ->> 'name', ''), split_part(email, '@', 1), 'Usuário Tori'),
    email
  into profile_name, profile_email
  from auth.users
  where id = current_user;

  insert into public.perfis (usuario_id, nome, email)
    values (current_user, profile_name, profile_email)
  on conflict (usuario_id) do update
    set nome = excluded.nome, email = excluded.email, atualizado_em = now();

  update public.membros_empresa set ativo = false
    where usuario_id = current_user and empresa_id <> tori_company;

  insert into public.membros_empresa (empresa_id, usuario_id, papel, ativo)
    values (tori_company, current_user, assigned_role, true)
  on conflict (empresa_id, usuario_id) do update
    set papel = excluded.papel, ativo = true;

  insert into public.auditoria (empresa_id, usuario_id, acao, entidade, entidade_id, detalhes)
    values (tori_company, current_user, 'vinculou', 'membro_empresa', current_user::text, jsonb_build_object('papel', assigned_role));

  return query select tori_company, assigned_role;
end;
$$;

revoke all on function public.vincular_usuario_tori() from public, anon;
grant execute on function public.vincular_usuario_tori() to authenticated;

commit;
