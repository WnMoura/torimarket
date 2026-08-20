import { useAuth } from "./hooks/useAuth";
import { hasSupabaseEnv, problemaDeConfiguracao } from "./supabase";
import { Login } from "./views/Login";
import { Painel } from "./Painel";

export default function App() {
  const { sessao, carregando } = useAuth();

  if (!hasSupabaseEnv) {
    const urlInvalida = problemaDeConfiguracao === "url-invalida";

    return (
      <main className="login-shell">
        <div className="card login-card">
          <h1>Falta configurar o Supabase</h1>
          <div className="alert" role="alert">
            {urlInvalida
              ? "VITE_SUPABASE_URL não é um endereço válido — precisa começar com https:// e apontar para o seu projeto."
              : "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em um arquivo .env.local."}
          </div>
          <p className="muted">
            {urlInvalida
              ? "Um `vercel env pull` sobrescreve o .env.local e pode trazer a variável mascarada. Copie a URL e a anon key do painel do Supabase (Project Settings → API) de volta para o arquivo."
              : "Os valores ficam no painel do Supabase, em Project Settings → API."}
          </p>
        </div>
      </main>
    );
  }

  if (carregando) {
    return (
      <main className="login-shell">
        <div className="card empty">Verificando sessão...</div>
      </main>
    );
  }

  // Sem sessão o Painel nem monta: o useStore só sai buscando dados depois do login.
  if (!sessao) return <Login />;

  return <Painel email={sessao.user.email} />;
}
