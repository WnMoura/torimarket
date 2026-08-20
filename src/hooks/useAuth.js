import { useEffect, useState } from "react";
import { hasSupabaseEnv, supabase } from "../supabase";

/** As mensagens do Supabase Auth vêm em inglês; só as que o usuário tem chance de ver. */
const TRADUCOES = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Este e-mail ainda não foi confirmado.",
  "Signups not allowed for this instance": "O cadastro está desligado. Peça um acesso ao administrador.",
};

export const traduzirErroDeLogin = (erro) =>
  TRADUCOES[erro?.message] || erro?.message || "Não foi possível entrar.";

export function useAuth() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setCarregando(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });

    // Cobre login, logout, expiração e refresh do token — inclusive em outra aba.
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      setCarregando(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { sessao, carregando };
}

export async function entrar(email, senha) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
}

export async function sair() {
  await supabase.auth.signOut();
}
