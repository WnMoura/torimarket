-- 007 — Cor do produto e logo do negócio
--
-- Aplique DEPOIS da 006, no SQL Editor do Supabase. Aditiva e transacional.
--
-- O que muda:
--   1. produtos.cor          — cor(es) do produto, texto livre (ex: "Preto, Rosa").
--      O tamanho já existia em produtos.tamanhos; a cor faltava.
--   2. configuracoes.logo_url — URL da logo do negócio, exibida no topo do app.
--
-- Ambas as colunas nascem nulas; nada existente é alterado.

begin;

alter table produtos add column if not exists cor text;
alter table configuracoes add column if not exists logo_url text;

commit;
