-- 006 — Metas com intervalo de datas personalizado
--
-- Aplique DEPOIS da 005, no SQL Editor do Supabase. Aditiva e transacional.
--
-- Por que existe: a meta só tinha período fixo (Diário/Semanal/Mensal/Anual), sempre a
-- janela corrente. Agora dá para criar uma meta "Personalizada" com data de início e fim
-- próprias — ex: uma campanha de 12 a 25 de dezembro.
--
-- O que muda:
--   1. metas.data_inicio / metas.data_fim — usadas quando o período é 'Personalizado'.
--      Ficam nulas nas metas antigas, que seguem funcionando pela janela do período.
--   2. O CHECK de periodo passa a aceitar 'Personalizado'.
--
-- Nada é apagado: as metas existentes continuam iguais.

begin;

alter table metas add column if not exists data_inicio date;
alter table metas add column if not exists data_fim date;

-- O CHECK inline do create table se chama metas_periodo_check. Troca pela versão que
-- também aceita 'Personalizado'.
alter table metas drop constraint if exists metas_periodo_check;
alter table metas add constraint metas_periodo_check
  check (periodo in ('Diário', 'Semanal', 'Mensal', 'Anual', 'Personalizado'));

commit;
