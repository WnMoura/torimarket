// Roda com: TZ=America/Sao_Paulo node verificacao.mjs
// Compara o comportamento ANTIGO (toISOString / UTC) com o NOVO (fuso local).
import assert from "node:assert/strict";
import { dayKey, monthKey } from "./src/lib/format.js";
import { goalIsMoney, goalProgress, periodStart } from "./src/lib/calc.js";
import { fmtInt, fmtMoney } from "./src/lib/format.js";
import { caminhoDaFoto, produtoAtivo } from "./src/lib/storage.js";

const ok = [];
const falhou = [];
const teste = (nome, fn) => {
  try {
    fn();
    ok.push(nome);
  } catch (e) {
    falhou.push(`${nome}\n     ${e.message.split("\n")[0]}`);
  }
};

console.log(`Fuso do processo: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`);

// ── 1. O bug que fazia as vendas da noite sumirem do painel ────────────────────
// 22h30 de 13/07 em São Paulo já é 01h30 de 14/07 em UTC.
const agora = new Date("2026-07-14T01:30:00Z");
// Venda feita às 10h da manhã do MESMO dia 13/07, horário de São Paulo.
const vendaDaManha = { criado_em: "2026-07-13T13:00:00+00:00", total: 250 };

teste("ANTIGO: às 22h30, a venda das 10h some do 'Vendas do dia'", () => {
  const hojeUTC = agora.toISOString().slice(0, 10); // "2026-07-14"
  const aparecia = String(vendaDaManha.criado_em).startsWith(hojeUTC);
  assert.equal(hojeUTC, "2026-07-14");
  assert.equal(aparecia, false, "era para o código antigo perder a venda");
});

teste("NOVO: às 22h30, a venda das 10h continua no dia 13/07", () => {
  assert.equal(dayKey(agora), "2026-07-13");
  assert.equal(dayKey(vendaDaManha.criado_em), "2026-07-13");
  assert.equal(dayKey(vendaDaManha.criado_em), dayKey(agora));
});

// ── 2. Coluna `date` pura: lançamento do dia 1º caindo no mês anterior ─────────
teste("ANTIGO: lançamento de 01/07 era lido como 30/06 (meia-noite UTC)", () => {
  const lidoComoUTC = new Date("2026-07-01");
  assert.equal(lidoComoUTC.getMonth(), 5, "junho — voltou um dia"); // 5 = junho
});

teste("NOVO: lançamento de 01/07 fica em julho", () => {
  assert.equal(monthKey("2026-07-01"), "2026-07");
  assert.equal(dayKey("2026-07-01"), "2026-07-01");
});

// ── 3. Metas de contagem não são dinheiro ─────────────────────────────────────
const metaVendas = { tipo: "Número de vendas", periodo: "Mensal", valor_alvo: 50 };
const metaFaturamento = { tipo: "Faturamento R$", periodo: "Mensal", valor_alvo: 5000 };

// O Intl separa "R$" do número com espaço não-quebrável (U+00A0), não com espaço comum.
const nbsp = " ";

teste("ANTIGO: meta de 50 vendas aparecia como 'R$ 10,00 de R$ 50,00'", () => {
  assert.equal(`${fmtMoney(10)} de ${fmtMoney(50)}`, `R$${nbsp}10,00 de R$${nbsp}50,00`);
});

teste("NOVO: meta de contagem usa fmtInt, meta de faturamento usa fmtMoney", () => {
  const fmtA = goalIsMoney(metaVendas) ? fmtMoney : fmtInt;
  const fmtB = goalIsMoney(metaFaturamento) ? fmtMoney : fmtInt;
  assert.equal(`${fmtA(10)} de ${fmtA(50)}`, "10 de 50");
  assert.equal(`${fmtB(1200)} de ${fmtB(5000)}`, `R$${nbsp}1.200,00 de R$${nbsp}5.000,00`);
});

// ── 4. "Mensal" = mês corrente, não "últimos 30 dias" ─────────────────────────
teste("NOVO: periodStart('Mensal') cai no dia 1º do mês vigente", () => {
  const inicio = periodStart("Mensal", new Date(2026, 6, 13, 10, 0)); // 13/07/2026 local
  assert.equal(inicio.getDate(), 1);
  assert.equal(inicio.getMonth(), 6); // julho
  assert.equal(inicio.getFullYear(), 2026);
});

teste("ANTIGO: setMonth(-1) pegava 13/06 — meio mês de vendas alheias", () => {
  const antigo = new Date(2026, 6, 13, 10, 0);
  antigo.setMonth(antigo.getMonth() - 1);
  assert.equal(antigo.getMonth(), 5); // junho
  assert.equal(antigo.getDate(), 13);
});

// ── 5. goalProgress conta certo dentro do mês corrente ────────────────────────
teste("NOVO: goalProgress soma só as vendas do período da meta", () => {
  const hoje = new Date();
  const inicioDoMes = periodStart("Mensal");
  const dentro = new Date(inicioDoMes.getTime() + 60_000);
  const fora = new Date(inicioDoMes.getTime() - 24 * 3600 * 1000);

  const vendas = [
    { criado_em: dentro.toISOString(), total: 300 },
    { criado_em: hoje.toISOString(), total: 200 },
    { criado_em: fora.toISOString(), total: 999 }, // mês passado, não entra
  ];

  assert.equal(goalProgress(metaFaturamento, { vendas, clientes: [] }), 500);
  assert.equal(goalProgress(metaVendas, { vendas, clientes: [] }), 2);
});

// ── 6. Exclusão de produto: caminho da foto no storage ────────────────────────
const BASE = "https://abc.supabase.co/storage/v1/object/public/produtos/";

teste("NOVO: extrai o caminho da foto para conseguir apagá-la do bucket", () => {
  assert.equal(caminhoDaFoto(`${BASE}9f3a-2b.jpg`), "9f3a-2b.jpg");
});

teste("NOVO: caminho com caracteres escapados volta decodificado", () => {
  assert.equal(caminhoDaFoto(`${BASE}legging%20preta.png`), "legging preta.png");
});

teste("NOVO: produto sem foto (ou com foto de fora) não tenta apagar nada", () => {
  assert.equal(caminhoDaFoto(""), null);
  assert.equal(caminhoDaFoto(null), null);
  assert.equal(caminhoDaFoto("https://exemplo.com/foto.jpg"), null);
});

// ── 7. Arquivamento: a app precisa funcionar ANTES da migração 002 ────────────
teste("NOVO: sem a coluna `ativo`, todo produto conta como ativo", () => {
  const antesDaMigracao = [{ nome: "Legging" }, { nome: "Top" }]; // vêm sem `ativo`
  assert.equal(antesDaMigracao.filter(produtoAtivo).length, 2);
  assert.equal(antesDaMigracao.filter((p) => !produtoAtivo(p)).length, 0);
});

teste("NOVO: com a coluna, só ativo=false é arquivado", () => {
  const depois = [
    { nome: "Legging", ativo: true },
    { nome: "Top", ativo: false },
  ];
  assert.deepEqual(depois.filter(produtoAtivo).map((p) => p.nome), ["Legging"]);
  assert.deepEqual(depois.filter((p) => !produtoAtivo(p)).map((p) => p.nome), ["Top"]);
});

console.log(`✅ ${ok.length} passaram`);
for (const nome of ok) console.log(`   • ${nome}`);
if (falhou.length) {
  console.log(`\n❌ ${falhou.length} falharam`);
  for (const nome of falhou) console.log(`   • ${nome}`);
  process.exit(1);
}
