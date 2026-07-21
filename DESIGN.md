---
name: Tori Market — Empresa Gestor Pro
description: Painel de gestão de varejo em preto e branco, denso e escuro, onde a cor só aparece quando o número exige.
colors:
  ink-black: "#08090b"
  on-accent: "#08090b"
  panel: "#121419"
  panel-raised: "#181b22"
  panel-control: "#20242d"
  field-well: "#0c0e12"
  rail: "#0d0f13"
  line: "#2b303b"
  text: "#f7f7f8"
  soft: "#d8dbe1"
  muted: "#a7adb8"
  accent-white: "#ffffff"
  positive: "#37d67a"
  attention: "#f5c84b"
  info: "#68a6ff"
  danger: "#ff5578"
  danger-well: "#3a111d"
  danger-ink: "#ffd5dd"
  bar-end: "#8f98a8"
  scrim-modal: "#000000b8"
  scrim-drawer: "#00000099"
typography:
  display:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.65rem, 2.4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  metric:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 2vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.3
  subtitle:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  metric-inline:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  caption:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  xs: "3px"
  sm: "6px"
  md: "8px"
  pill: "999px"
  bar: "7px 7px 3px 3px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "18px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.md}"
    padding: "9px 13px"
    height: "42px"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.panel-control}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "9px 13px"
    height: "42px"
  button-danger:
    backgroundColor: "{colors.danger-well}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "9px 13px"
    height: "42px"
  icon-button:
    backgroundColor: "{colors.panel-control}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    width: "38px"
    height: "38px"
  input:
    backgroundColor: "{colors.field-well}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "43px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "18px"
  list-row:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
  nav-item:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  nav-item-active:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
  status-pill:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
  segmented-active:
    backgroundColor: "{colors.accent-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: Tori Market — Empresa Gestor Pro

## 1. Overview

**Creative North Star: "The Night Counter"**

O balcão à noite: a sala está escura, a luz cai só onde o trabalho acontece. O fundo é
quase-preto (`#08090b`), os painéis são grafite, e o branco puro é a luz — ele marca a ação
primária, a aba ativa, a barra do gráfico. Nada mais compete por atenção. Quando uma cor
aparece, ela está dizendo alguma coisa: verde é resultado positivo, rosa é perigo, amarelo é
atenção, azul é informação. Cor sem significado não entra.

A marca é preto e branco, e o sistema leva isso a sério: a identidade não vem de um roxo de
startup, vem do contraste. Isso libera a paleta semântica para trabalhar de verdade — num painel
onde tudo já fosse colorido, o verde de "meta batida" seria só mais um tom. A densidade é alta
por escolha: doze telas de uso diário, um operador só, nenhuma delas pode exigir rolagem para
achar o número. O ritmo de espaço (14–24px) e a régua de 1px em `#2b303b` fazem a leitura;
não a cor de fundo.

Este sistema rejeita duas coisas por nome. **ERP de contador**: cinza sobre cinza, fileira de
abas, fonte de 11px, densidade que veio de desleixo. E **landing de startup SaaS**: gradiente
decorativo, número gigante com rótulo minúsculo, card dentro de card, seção que existe para
impressionar. Este é um app de trabalho.

**Key Characteristics:**
- Escuro por padrão, sem tema claro
- Uma família tipográfica (Inter variável, self-hosted) em cinco pesos, escala fixa em rem
- Acento monocromático: branco puro carrega toda ação primária
- Quatro cores semânticas, nenhuma decorativa
- Profundidade por camada tonal e régua de 1px, não por sombra
- Um único raio (8px) em tudo que não é pílula

## 2. Colors

Uma rampa de grafite em cinco degraus, um branco de luz e quatro sinais — nada além disso.

### Primary
- **Counter White** (`#ffffff`): a luz do balcão. Botão primário, aba ativa do segmented,
  topo da barra do gráfico, avatar do perfil. É o único "acento" do sistema, e o preto do texto
  sobre ele (`#08090b`) é o par obrigatório. Nunca use branco puro como fundo de superfície
  grande; ele é pontual por definição.

### Secondary
- **Ledger Green** (`#37d67a`): valor positivo, lucro, meta atingida, progresso concluído.
- **Counter Red** (`#ff5578`): perda, exclusão, estoque zerado, erro de formulário. Acompanhado
  do seu poço escuro **Red Well** (`#3a111d`) para fundos de alerta e do stroke a 42% de opacidade.
- **Signal Amber** (`#f5c84b`): atenção — estoque baixo, meta em risco, migração pendente.
- **Signal Blue** (`#68a6ff`): informação neutra, links e referências cruzadas.

### Neutral
- **Ink Black** (`#08090b`): fundo do documento. O chão de tudo.
- **Rail** (`#0d0f13`): a barra lateral e o trilho do segmented — meio degrau abaixo do painel,
  para a navegação recuar em relação ao conteúdo.
- **Field Well** (`#0c0e12`): fundo de input, progress e qualquer coisa em que se digita. Campo
  é um poço, não uma elevação.
- **Panel** (`#121419`): superfície de card, modal e barra de negócio.
- **Panel Raised** (`#181b22`): linha de lista e item de nav ativo, um degrau acima do card.
- **Panel Control** (`#20242d`): botão secundário e icon button — a superfície mais alta,
  reservada a controle.
- **Line** (`#2b303b`): régua de 1px. Borda de card, divisória de tabela, contorno de campo.
- **Text** (`#f7f7f8`): corpo e valores.
- **Soft** (`#d8dbe1`): célula de tabela, label de campo — texto secundário que ainda precisa
  ser lido sem esforço.
- **Muted** (`#a7adb8`): rótulo de métrica, cabeçalho de tabela, estado vazio, nav inativo.

### Named Rules

**The Meaning-Only Rule.** Verde, âmbar, azul e rosa só entram quando carregam significado de
estado. Um número neutro é branco ou `soft`, nunca colorido "para ficar bonito".

**The Two-Tone Brand Rule.** A identidade é preto e branco. Nenhuma cor de marca adicional entra
no sistema; se algum dia entrar, ela substitui o branco no papel de acento — não se soma a ele.

**The Muted Floor Rule.** `#a7adb8` é o cinza mais escuro permitido para texto sobre `panel`.
Nada abaixo disso. Rótulo em cinza mais fraco "para elegância" é proibido: o app é usado no
celular, no meio do expediente.

## 3. Typography

**Interface Font:** Inter Variable, self-hosted via `@fontsource-variable/inter` (subset latino,
~48 KB, `font-display: swap`), com fallback `ui-sans-serif, system-ui, -apple-system,
BlinkMacSystemFont, "Segoe UI", sans-serif`

**Character:** Uma família só, em cinco pesos. Inter é neutra o bastante para desaparecer atrás
do número e tem os algarismos tabulares e a legibilidade em corpo pequeno que uma tabela de
preço exige. Não há fonte display, não há par serif/sans: hierarquia vem de peso e tamanho.

### Hierarchy
- **Display** (700, `clamp(1.65rem, 2.4vw, 2.5rem)`, 1.15): título da tela no topbar. Único
  lugar do sistema com tamanho fluido, e ele cai para 1.5rem fixo abaixo de 480px.
- **Metric** (800, `clamp(1.35rem, 2vw, 2rem)`, 1.1): o valor dentro do metric card. É o
  elemento mais pesado da tela porque é o produto.
- **Title** (600, `1.1rem`): título de card (`h2`).
- **Subtitle** (600, `0.98rem`): sub-bloco dentro de card (`h3`).
- **Body** (400, `1rem`, 1.5): texto corrido e conteúdo de linha de lista. Prosa não passa de
  65–75ch; tabela e dado podem ir além.
- **Metric inline** (800, `1.5rem`, 1.1): valor de fechamento em linha — total da venda no
  modal, saldo do mês no caixa. Vive numa `.total-line`, nunca num `<h2>`.
- **Caption** (400, `0.9rem`): sub-linha de métrica, descrição de linha de lista, rótulo de campo.
- **Label** (500, `0.75rem`, `0.08em`, caixa alta): rótulo de métrica, cabeçalho de tabela
  (`0.76rem`/`0.06em`) e o eyebrow do topbar (`0.74rem`/`0.09em`). Sempre em `muted`.

### Named Rules

**The One Family Rule.** Inter carrega tudo. Nenhuma fonte display, nenhuma mono decorativa,
nenhum segundo sans "para dar contraste".

**The Tabular Rule.** `font-variant-numeric: tabular-nums` no `body`: em coluna de preço e em
valor que atualiza, o dígito não pode mudar de largura.

**The Fixed Scale Rule.** Fora do título de tela e do valor de métrica, todo tamanho é fixo em
rem. Tipografia fluida em UI de produto encolhe onde não devia; responsividade aqui é estrutural.

**The Caps-Are-Labels Rule.** Caixa alta com tracking existe só para rótulo de dado (métrica,
coluna de tabela, eyebrow do topbar). Nunca em título de seção, nunca em frase, nunca em botão.

## 4. Elevation

O sistema é plano. Profundidade vem de **camada tonal** — a rampa `ink-black` → `panel` →
`panel-raised` → `panel-control`, com o `field-well` descendo abaixo do painel — reforçada por
uma régua de 1px em `line`. Cada degrau significa uma coisa: conteúdo, item de lista, controle,
campo. Sombra é reservada ao que de fato flutua sobre a página.

### Shadow Vocabulary
- **Floating** (`box-shadow: 0 18px 60px rgba(0, 0, 0, 0.34)`): modal, gaveta lateral aberta e
  o card de login. Nada mais.
- **Scrim** (`background: rgba(0, 0, 0, 0.72)` no overlay de modal; `0.6` no overlay da gaveta):
  o escurecimento que separa a camada flutuante do resto.

### Named Rules

**The Flat-Card Rule.** Card em repouso não tem sombra. O que separa o card do fundo é o degrau
de cor mais a borda de 1px. A sombra `Floating` pertence a modal, gaveta e card de login.

**The Well-vs-Riser Rule.** Se o usuário digita ali, o fundo desce (`field-well`). Se ele clica
ali, o fundo sobe (`panel-control`). Não invente um terceiro comportamento.

## 5. Components

### Buttons
- **Shape:** cantos suavemente curvos (8px), altura mínima de 42px — alvo de toque de balcão.
- **Primary:** branco puro sobre texto preto, peso 800, borda da mesma cor do fundo. Uma por
  tela; é a ação que fecha a tarefa (Salvar, Registrar venda).
- **Secondary:** `panel-control` com borda `line` e texto `text`. O padrão para tudo o mais.
- **Danger:** texto e borda em `Counter Red`, fundo em rosa a 9% de opacidade. Nunca preenchido
  sólido — destruição pede confirmação, não convite.
- **Hover:** 150ms em `background` e `border-color`. Secundário e icon button sobem para `line`;
  o primário desce para `soft`; o destrutivo adensa o lavado para 18%.
- **Focus:** anel único do sistema — `outline: 2px solid` no branco de acento, `outline-offset: 2px`,
  aplicado por `:focus-visible` a todo botão, campo, select e link.
- **Disabled:** opacidade 0.55 e `cursor: not-allowed`. Todo formulário trava o botão enquanto envia.
- **Full:** variante `.full` ocupa 100% da largura — usada em modal e no login.

### Icon Buttons
Quadrado de 38px, mesmo raio e mesma superfície do botão secundário, ícone Lucide de 17px com
stroke 1.9. Variante `danger` troca só cor e borda. Todo icon button precisa de `aria-label`.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** `panel`; a variante `danger` do metric card usa o poço vermelho chapado, com o valor em `Counter Red`.
- **Shadow Strategy:** nenhuma em repouso (ver Elevation).
- **Overflow:** todo filho de `.grid` leva `min-width: 0` — sem isso a tabela de 720px empurra a
  coluna para fora da viewport em vez de rolar dentro do `.table-wrap`.
- **Border:** 1px em `line`, sempre completa.
- **Internal Padding:** 18px, caindo para 14px abaixo de 480px.
- **Metric card:** rótulo em caixa alta `muted`, valor em peso 800, sub-linha em `caption`
  (`muted`, 0.9rem). Altura mínima de 126px no desktop, livre no celular. A variante `danger`
  só entra quando o valor é de fato negativo.

### Inputs / Fields
- **Style:** poço `field-well`, borda 1px `line`, raio 8px, altura mínima 43px, padding 10/12.
  Label acima do campo em `soft`, 0.9rem, gap de 7px.
- **Focus:** a borda vai para `text` **e** o anel do sistema aparece por `:focus-visible`.
  As duas coisas juntas: a borda dá o estado, o anel dá a visibilidade a quem navega por teclado.
- **Readonly:** texto em `muted` sobre `#101217` — o campo calculado se lê como resultado, não
  como entrada.
- **Grid:** duas colunas (`form-grid`), coluna única abaixo de 760px; `.field.full` atravessa.

### Navigation
- **Sidebar:** 276px fixos, fundo `rail`, borda direita de 1px. Item inativo em `muted` com
  fundo transparente; ativo e hover em `panel-raised` + texto `text` + borda `line`. Ícone
  Lucide de 19px.
- **Mobile (≤760px):** a barra vira gaveta (`translateX(-100%)`, 220ms), aberta por hambúrguer
  à esquerda do topbar, fechada por botão próprio ou pelo scrim. O topbar vira grid de três
  colunas com o título centralizado de verdade.
- **Segmented:** trilho `rail` com padding de 4px; botão ativo em branco puro sobre preto,
  raio 6px. É o seletor de período padrão.

### Tables
Largura total, `border-collapse`, mínimo de 720px com rolagem horizontal em `.table-wrap`
(560px abaixo de 480px). Cabeçalho em label caixa alta `muted`; célula em `soft`; divisória de
1px em `line` no rodapé de cada linha. Sem zebra, sem borda vertical.

### Status Pill
Pílula (999px) com borda `line`, fundo herdado, texto `muted` a 0.78rem. Estado neutro por
padrão; assume `positive` / `danger` só quando o estado for de fato esse.

### Modal
`<dialog>` nativo, aberto por `showModal()`: o navegador dá Esc, prisão de foco, devolução do
foco a quem abriu e inerte no resto da página. `min(760px, 100vw - 28px)`,
`max-height: calc(100dvh - 36px)` com rolagem interna, superfície `panel`, sombra `Floating`
sobre `::backdrop` a 72%; `html:has(dialog[open])` trava a rolagem do fundo. No mobile, abrir
empurra uma entrada no histórico — o "voltar" fecha a modal em vez de sair do app.
Modal é o último recurso: resolva inline antes.

### Confirmação destrutiva
`useConfirmacao()` devolve `[confirmar, dialogo]`: `confirmar()` é uma promessa que resolve
em true/false, `dialogo` é o JSX a renderizar. Usa a mesma `Modal`, em variante `estreita`
(460px). Título é a pergunta com o valor em jogo ("Excluir a venda de R$ 259,80?"), corpo é a
consequência em prosa (≤62ch), ações à direita com **Cancelar** primeiro e o destrutivo por
último, em contorno. O foco começa no Cancelar: um Enter distraído não apaga venda.
O `confirm()` do navegador é proibido — é a única superfície que sai da linguagem visual.

### Skeleton de carregamento
A tela inicial carrega mostrando a forma do que vem: quatro metric cards e dois painéis, com
blocos em `panel-2` e um brilho que corre até `panel-3` (1,4s). Nada de spinner nem frase no
meio do vazio. Sob `prefers-reduced-motion` o brilho some e fica só o degrau de cor. O bloco
carrega `aria-busy` e um texto exclusivo para leitor de tela.

### Total line
Régua de 1px acima, rótulo em label caixa alta `muted` à esquerda, valor em `metric-inline` à
direita. É onde mora o total da venda e o saldo do mês — dado de fechamento, não título.

### Bar Chart (signature)
Grade de barras com altura de 280px (220px no celular), colunas geradas por `--bars`. A barra é
um gradiente vertical do branco ao cinza-aço (`#8f98a8`), com topo arredondado (7px) e base
quase reta (3px) — a única gradiente permitida no sistema, porque desenha volume, não decoração.
Tooltip no hover via `::after`, em branco sobre preto.

### Progress
Trilho pílula de 10px em `field-well` com borda `line`; preenchimento em gradiente branco →
`Ledger Green`, largura controlada por `--progress`.

### Empty / Alert
- **Empty:** texto centralizado em `muted`, 18px de respiro vertical. A frase diz o que falta e,
  quando há filtro ativo, distingue "nada cadastrado" de "nada para essa busca".
- **Alert:** bloco de 13/14px, borda e fundo do poço vermelho, texto `Danger Ink` (`#ffd5dd`).
  Usado para migração pendente e erro de operação; carrega `role="alert"` para ser anunciado.

## 6. Do's and Don'ts

### Do:
- **Do** manter o acento em branco puro (`#ffffff`) para ação primária, aba ativa e barra do
  gráfico — uma ação primária por tela.
- **Do** usar cor semântica só com significado de estado: `#37d67a` positivo, `#f5c84b` atenção,
  `#68a6ff` informação, `#ff5578` perigo.
- **Do** construir profundidade pela rampa tonal (`#08090b` → `#121419` → `#181b22` → `#20242d`)
  mais a régua de 1px em `#2b303b`.
- **Do** usar 8px de raio em tudo, e 999px só em pílula e progress.
- **Do** manter Inter como família única, em escala fixa em rem fora do título de tela e do
  valor de métrica.
- **Do** crescer o alvo para 44px em `@media (pointer: coarse)`; no ponteiro fino, 38–43px basta.
- **Do** dar a todo controle o anel de foco do sistema e travar o botão enquanto o envio corre.
- **Do** dar a toda tela um estado vazio que explique o que falta, no padrão de `Clients.jsx`
  (distingue "nada cadastrado" de "nada para essa busca").
- **Do** deixar tabela rolar dentro de `.table-wrap`; o corpo da página nunca rola na horizontal.
- **Do** deixar campo dentro de `.filters` com `width: auto` e `flex: 1 1 180px` — o `width: 100%`
  global faz cada filtro exigir a linha inteira.
- **Do** dimensionar ícone por regra (`.btn svg` 16px, `.icon-button svg` 17px), nunca por
  `size={}` em cada chamada.
- **Do** respeitar `env(safe-area-inset-*)` em shell, modal e gaveta.

### Don't:
- **Don't** parecer **ERP antigo / sistema de contador**: cinza sobre cinza, fileira de abas,
  fonte abaixo de 0.75rem, densidade sem ritmo de espaço.
- **Don't** parecer **landing de startup SaaS**: gradiente decorativo, número gigante com rótulo
  minúsculo como enfeite, card dentro de card, seção que existe para impressionar.
- **Don't** usar `background-clip: text` com gradiente. A única gradiente do sistema é a barra
  do gráfico e a barra de progresso.
- **Don't** aninhar card dentro de card. Use linha de lista (`panel-raised`) dentro do card.
- **Don't** usar `border-left` colorida maior que 1px como faixa de destaque em card, linha ou
  alerta. Use borda completa ou fundo do poço.
- **Don't** introduzir uma segunda família tipográfica, nem caixa alta fora de rótulo de dado.
- **Don't** colocar texto abaixo de `#a7adb8` sobre `#121419`.
- **Don't** aplicar sombra em card em repouso; ela pertence a modal, gaveta e login.
- **Don't** usar `confirm()`, `alert()` ou `prompt()` do navegador. A pergunta mora na modal.
- **Don't** abrir modal para o que cabe inline. Se a tarefa é um campo e um botão, ela mora na
  tela.
- **Don't** animar entrada de seção ou orquestrar carregamento. Movimento aqui é 150–250ms e só
  comunica estado — e todo movimento tem alternativa em `prefers-reduced-motion` (a gaveta
  aparece em vez de deslizar).
- **Don't** deixar cor literal no CSS: tudo passa por token, inclusive os scrims e o texto do alerta.
- **Don't** preencher botão de exclusão com rosa sólido; destrutivo é contorno, não convite.
