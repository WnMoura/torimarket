-- 010 — Foto do usuário
--
-- Aplique DEPOIS da 009, no SQL Editor do Supabase. Aditiva e transacional.
--
-- O que muda:
--   1. configuracoes.foto_usuario — URL da foto de perfil, exibida no círculo da barra
--      lateral. Nasce nula: sem foto, o círculo continua mostrando a inicial do nome.
--
-- A foto vai para o mesmo bucket `produtos` que já guarda a logo do negócio e as fotos
-- de produto — mesmo caminho, mesmas policies, nome de arquivo em UUID.

begin;

alter table configuracoes add column if not exists foto_usuario text;

commit;
