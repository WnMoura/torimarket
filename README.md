# Tori Market — Empresa Gestor Pro

Gestor de varejo em React + Vite com Supabase: precificação, estoque, clientes, metas,
fluxo de caixa, DRE e insights.

## Rodando

```bash
pnpm install
cp .env.example .env.local   # preencha com a URL e a anon key do seu projeto Supabase
pnpm dev
```

## Banco

O schema base está em `supabase_schema.sql`. As mudanças posteriores ficam em `migrations/`,
numeradas, para aplicar **em ordem** no **SQL Editor do Supabase**.

| Arquivo | O que traz |
| --- | --- |
| `001_integridade_vendas.sql` | `registrar_venda()` — venda, itens e baixa de estoque numa transação; `itens_venda.custo_unitario` congela o custo da época. |
| `002_arquivar_produtos.sql` | `produtos.ativo` — produto já vendido é arquivado, não excluído; policy de delete no bucket, para a foto sair junto. |
| `003_excluir_venda.sql` | `excluir_venda()` — estorna a venda devolvendo o estoque. |
| `004_exigir_login.sql` | Fecha o banco: as policies passam de `anon` para `authenticated`. |

**As quatro são obrigatórias para esta versão do frontend.** Enquanto faltar alguma das três
primeiras, as telas que dependem dela mostram um aviso pedindo a migração — nada é corrompido.

Da `001` à `003` tudo é aditivo (`add column`, `create function`, `check ... not valid`) e roda
dentro de uma transação: se qualquer passo falhar, nada daquele arquivo é aplicado.

## Login

A `004` é diferente das outras: **ela e o deploy do frontend têm que ser feitos juntos.** Ao trocar
as policies de `anon` para `authenticated`, qualquer versão antiga que esteja no ar para de
carregar na hora — ela fala com o banco como anônimo.

Antes de aplicar:

1. **Desligue o cadastro público** — Supabase → Authentication → Sign In / Providers → Email →
   desmarque *Enable signup*. As policies liberam tudo para qualquer usuário autenticado; com o
   signup aberto, qualquer pessoa cria uma conta e entra, e não teria adiantado nada fechar o anon.
2. **Crie os usuários à mão** — Authentication → Users → Add user.

O app não tem tela de cadastro, só de login, justamente por isso.

## Testes

```bash
pnpm test
```

Cobre as regressões de data (fuso), formatação de metas, cálculo de período e as regras de
arquivamento/exclusão de produto.

## Limite conhecido do modelo de acesso

Todo usuário autenticado enxerga e edita tudo — não há papéis nem separação por loja. Para o uso
atual (um negócio, poucos operadores) isso é suficiente; se um dia entrar mais de uma loja no mesmo
banco, as policies precisam passar a filtrar por um `org_id`.

A leitura das fotos no bucket `produtos` continua pública, porque as imagens são carregadas
direto no `<img>`. Os nomes dos arquivos são UUIDs.
