# Tori Gestão

Painel operacional exclusivo da Tori. O runtime principal usa Next.js App Router, TypeScript, Supabase Auth/Postgres/Storage e Vercel. Os arquivos Vite em `src/` e as migrations antigas em `migrations/` foram preservados apenas como histórico.

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

## Banco de dados seguro

Para o runtime Next.js, execute em homologação, nesta ordem:

1. [`supabase/migrations/20260820_secure_gestor_pro.sql`](supabase/migrations/20260820_secure_gestor_pro.sql)
2. [`supabase/migrations/20260821_tori_single_company.sql`](supabase/migrations/20260821_tori_single_company.sql)

As migrations:

- cria empresas, perfis, membros, variações, movimentos e auditoria;
- associa os registros legados à empresa inicial;
- cria uma variação padrão por produto sem distribuir estoque entre tamanhos;
- fixam a operação na empresa Tori e aplicam RLS por função e MFA `aal2`;
- torna o bucket `produtos` privado;
- registram vendas, baixa de estoque e cancelamento em funções transacionais;
- vinculam automaticamente o primeiro usuário MFA como administrador e os próximos como vendedores.

Não execute o `supabase_schema.sql` legado nem as policies `anon_full_*` para novos ambientes. Os arquivos numerados em `migrations/` pertencem ao histórico Vite do ToriMarket; valide a compatibilidade antes de aplicá-los em um banco que receberá o runtime seguro.

O usuário administrador deve existir no Supabase Auth com o mesmo email de `SUPABASE_INITIAL_ADMIN_EMAIL`. No primeiro login com MFA confirmado, o vínculo de administrador é criado na empresa inicial.

## Desenvolvimento Next.js

```powershell
pnpm install
pnpm dev
```

Validações:

```powershell
pnpm run build
pnpm run lint
pnpm start
```

## Frontend Vite legado

Os arquivos do ToriMarket original permanecem disponíveis para referência. Para executá-lo isoladamente, use o script `dev:torimarket` e aplique somente as migrations compatíveis com aquele frontend, após revisão de segurança.

## Publicação

Na Vercel, cadastre as variáveis server-side para Preview e Production. Depois de validar a homologação, publique o build e acompanhe autenticação, MFA, erros, vendas, estoque e divergências de totais. Mantenha o backup e o deploy anterior até a validação final.

## Funcionalidades protegidas

- `admin`: acesso total, equipe, segurança, configurações e auditoria;
- `gerente`: produtos, estoque, vendas, clientes, metas, caixa, DRE e relatórios;
- `vendedor`: vendas, clientes, consulta de produtos e estoque.

Todos os uploads do runtime Next.js são validados no servidor, limitados a 5 MB, reprocessados para WebP e armazenados por chave interna em bucket privado.
