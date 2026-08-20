import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function ehUrlHttp(valor) {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Por que isto não é um `createClient` direto: o construtor do Supabase joga exceção
 * quando a URL não presta, e isso acontece no import — antes do React montar. O app
 * inteiro virava tela branca, sem nem o CSS, escondendo a tela de "falta configurar"
 * que já existe. Aqui o problema vira um valor, e quem renderiza decide o que dizer.
 */
function conectar() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { cliente: null, problema: "faltando" };
  }
  if (!ehUrlHttp(supabaseUrl)) {
    return { cliente: null, problema: "url-invalida" };
  }

  try {
    return { cliente: createClient(supabaseUrl, supabaseAnonKey), problema: null };
  } catch (erro) {
    return { cliente: null, problema: "url-invalida", detalhe: erro?.message };
  }
}

const conexao = conectar();

export const supabase = conexao.cliente;
export const problemaDeConfiguracao = conexao.problema;
export const detalheDaConfiguracao = conexao.detalhe || "";
export const hasSupabaseEnv = conexao.problema === null;
