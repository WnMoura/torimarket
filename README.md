# Empresa Gestor Pro

Painel operacional seguro para vendas, produtos, estoque por variação, clientes, metas e finanças. A aplicação usa Next.js App Router, TypeScript, Supabase Auth/Postgres/Storage e está preparada para hospedagem na Vercel.

## Segurança antes do primeiro deploy

1. Revogue a chave secreta que foi compartilhada anteriormente e gere uma nova no Supabase.
2. Nunca coloque `SUPABASE_SECRET_KEY` em `NEXT_PUBLIC_*`, `VITE_*`, código client-side ou no Git.
3. Configure as variáveis somente no ambiente do servidor:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
SUPABASE_INITIAL_ADMIN_EMAIL
```

4. Não publique `.env.local`. Ele já está ignorado pelo Git.

## Banco de dados

Execute primeiro em uma cópia de homologação o arquivo [`supabase/migrations/20260820_secure_gestor_pro.sql`](supabase/migrations/20260820_secure_gestor_pro.sql). A migration:

- cria empresas, perfis, membros, variações, movimentos e auditoria;
- associa os registros legados à empresa inicial;
- cria uma variação padrão por produto sem distribuir estoque entre tamanhos;
- aplica RLS por empresa e função;
- exige sessão MFA `aal2` nas policies;
- torna o bucket `produtos` privado;
- registra vendas, baixa de estoque e cancelamento em funções transacionais.

O usuário administrador deve existir no Supabase Auth com o mesmo email de `SUPABASE_INITIAL_ADMIN_EMAIL`. No primeiro login com MFA confirmado, o vínculo de administrador é criado na empresa inicial.

## Desenvolvimento

```powershell
pnpm install
pnpm dev
```

Validações de produção:

```powershell
pnpm run build
pnpm run lint
pnpm start
```

## Publicação

Na Vercel, cadastre as quatro variáveis server-side para Preview e Production. Depois de validar a homologação, publique o build e acompanhe login, MFA, erros, vendas, estoque e divergências de totais. Mantenha o backup e o deploy anterior até a validação final.

## Funcionalidades protegidas

- `admin`: acesso total, equipe, segurança, configurações e auditoria;
- `gerente`: produtos, estoque, vendas, clientes, metas, caixa, DRE e relatórios;
- `vendedor`: vendas, clientes, consulta de produtos e estoque.

Todos os uploads são validados no servidor, limitados a 5 MB, reprocessados para WebP e armazenados por chave interna em bucket privado.
