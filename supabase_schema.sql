create extension if not exists "pgcrypto";

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  foto_url text,
  custo numeric default 0,
  custos_variaveis numeric default 0,
  frete numeric default 0,
  margem_desejada numeric default 40,
  preco_sugerido numeric default 0,
  preco_final numeric default 0,
  estoque integer default 0,
  tamanhos text default 'P,M,G,GG',
  descricao text,
  criado_em timestamptz default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato text,
  email text,
  preferencias text,
  observacoes text,
  criado_em timestamptz default now()
);

create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  contato text,
  forma_pagamento text not null check (forma_pagamento in ('Pix', 'Crédito', 'Débito', 'Dinheiro')),
  observacoes text,
  total numeric default 0,
  criado_em timestamptz default now()
);

create table if not exists itens_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references vendas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete restrict,
  quantidade integer not null default 1,
  preco_unitario numeric default 0
);

create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('Faturamento R$', 'Número de vendas', 'Novos clientes')),
  descricao text,
  periodo text not null check (periodo in ('Diário', 'Semanal', 'Mensal', 'Anual')),
  valor_alvo numeric not null default 0,
  criado_em timestamptz default now()
);

create table if not exists configuracoes (
  id integer primary key default 1 check (id = 1),
  nome_negocio text default 'Meu negócio',
  nome_usuario text default 'Usuário',
  taxa_credito numeric default 4.5,
  taxa_debito numeric default 2,
  taxa_pix numeric default 0,
  taxa_dinheiro numeric default 0
);

create table if not exists lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saída')),
  descricao text not null,
  valor numeric not null default 0,
  data date not null default current_date,
  criado_em timestamptz default now()
);

insert into configuracoes (id)
values (1)
on conflict (id) do nothing;

alter table produtos enable row level security;
alter table clientes enable row level security;
alter table vendas enable row level security;
alter table itens_venda enable row level security;
alter table metas enable row level security;
alter table configuracoes enable row level security;
alter table lancamentos enable row level security;

drop policy if exists "anon_full_produtos" on produtos;
drop policy if exists "anon_full_clientes" on clientes;
drop policy if exists "anon_full_vendas" on vendas;
drop policy if exists "anon_full_itens_venda" on itens_venda;
drop policy if exists "anon_full_metas" on metas;
drop policy if exists "anon_full_configuracoes" on configuracoes;
drop policy if exists "anon_full_lancamentos" on lancamentos;

create policy "anon_full_produtos" on produtos for all using (true) with check (true);
create policy "anon_full_clientes" on clientes for all using (true) with check (true);
create policy "anon_full_vendas" on vendas for all using (true) with check (true);
create policy "anon_full_itens_venda" on itens_venda for all using (true) with check (true);
create policy "anon_full_metas" on metas for all using (true) with check (true);
create policy "anon_full_configuracoes" on configuracoes for all using (true) with check (true);
create policy "anon_full_lancamentos" on lancamentos for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "anon_upload_produtos" on storage.objects;
drop policy if exists "anon_read_produtos" on storage.objects;

create policy "anon_upload_produtos"
on storage.objects for insert
with check (bucket_id = 'produtos');

create policy "anon_read_produtos"
on storage.objects for select
using (bucket_id = 'produtos');
