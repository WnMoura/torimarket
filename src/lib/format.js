const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const num = (v) => Number(v || 0);
export const fmtMoney = (v) => brl.format(num(v));
export const fmtInt = (v) => inteiro.format(num(v));

/**
 * O Postgres devolve `timestamptz` com offset ("2026-07-13T23:40:00+00:00") e `date`
 * como texto puro ("2026-07-13"). new Date() lê o texto puro como meia-noite UTC, o
 * que no Brasil (UTC-3) volta um dia. Só o formato puro precisa ser montado à mão.
 */
export function asDate(value) {
  if (value instanceof Date) return value;
  const texto = String(value ?? "");
  const puro = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  return puro ? new Date(+puro[1], +puro[2] - 1, +puro[3]) : new Date(texto);
}

/**
 * Chave AAAA-MM-DD no fuso de quem está olhando. Usar toISOString() aqui — como o
 * código fazia — joga toda venda feita depois das 21h para o dia seguinte em UTC,
 * fazendo ela sumir do painel do dia.
 */
export function dayKey(value = new Date()) {
  const d = asDate(value);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export const monthKey = (value = new Date()) => dayKey(value).slice(0, 7);
export const today = () => dayKey();
export const currentMonth = () => monthKey();

export const dateBR = (value) => (value ? asDate(value).toLocaleDateString("pt-BR") : "-");

export const dayLabel = (value) =>
  asDate(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export const monthLabel = (value) =>
  asDate(value).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
