-- 009 — Taxa de crédito por parcela
--
-- Aplique DEPOIS da 008, no SQL Editor do Supabase. Aditiva e transacional.
--
-- Por que existe: o crédito tinha uma taxa única (taxa_credito). Agora a taxa pode variar
-- por parcela — a 1x segue em taxa_credito, e entram 2x e 3x.
--
-- O que muda: duas colunas novas em configuracoes, começando em 0 (você define nas
-- Configurações). Nada existente é alterado.

begin;

alter table configuracoes add column if not exists taxa_credito_2x numeric default 0;
alter table configuracoes add column if not exists taxa_credito_3x numeric default 0;

commit;
