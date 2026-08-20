# Product

## Register

product

## Platform

web

## Users

Um operador único: o dono da loja. Ele cadastra produto, calcula preço, registra a venda,
lança o caixa e depois olha o resultado — tudo na mesma sessão de trabalho, alternando entre
desktop e celular conforme o momento do dia. Não há papéis nem separação por loja; quem entra
faz tudo. Nenhuma tela é "a principal": precificação, estoque, venda, faturamento, caixa, metas
e DRE são todas de uso diário, então nenhuma pode ser a que ficou mal resolvida.

## Product Purpose

Substituir o controle paralelo em planilha e caderno por um lugar só, onde o custo é congelado
no momento da venda e a margem que aparece no fim do mês é a margem que aconteceu. A partir daí,
o estoque e os insights dizem o que gira, o que encalha e o que vale repor. O sistema funciona
quando o dono confia no número sem precisar conferir em outro lugar.

## Positioning

A loja inteira numa tela só: preço, estoque, caixa, meta e DRE no mesmo sistema, sem trocar de
ferramenta e sem reconciliação manual entre elas.

## Brand Personality

Ágil e afiada. Feita para quem tem pressa: densidade de informação, resposta imediata, atalho
antes de assistente. Fala em números e em português direto, sem celebrar nem dramatizar — a tela
mostra o estado e sai da frente. Escuro, contido, sem decoração que não carregue informação.

## Anti-references

ERP antigo ou sistema de contador: cinza sobre cinza, fileira de abas, fonte minúscula, densidade
que vem de desleixo e não de intenção. E landing de startup SaaS: gradiente, número gigante com
rótulo pequeno, card dentro de card, seções que existem para impressionar. Este é um app de
trabalho, não uma peça de venda.

## Design Principles

**O número é o produto.** Cada tela existe para entregar um valor confiável; hierarquia, cor e
espaço servem para achar esse valor rápido, nunca para enfeitá-lo.

**Densidade com intenção.** Muita informação por tela é uma virtude aqui — desde que o agrupamento,
o alinhamento e o ritmo de espaço façam a leitura, e não o zoom do usuário.

**Mesma gramática em toda parte.** Botão, campo, tabela, modal e estado vazio se comportam igual
nas doze telas. Consistência vale mais que variedade.

**Nada quebra em silêncio.** Migração faltando, dado ausente, filtro sem resultado: o sistema diz
o que houve e o que fazer, em vez de mostrar tela vazia ou número errado.

**Celular é uso real, não fallback.** O layout colapsa por estrutura (gaveta, tabela responsiva,
coluna única), não encolhendo tipografia.

## Accessibility & Inclusion

WCAG AA como padrão, sem exigência adicional. A paleta atual já passa com folga: o cinza dos
rótulos secundários dá 8,17:1 sobre o painel e o menor contraste do sistema é o rosa de perigo,
em 5,99:1. O anel de foco do sistema (branco, 2px, offset 2px) cobre todo controle interativo, e
toda animação tem alternativa em `prefers-reduced-motion`.
