import { useAuth } from "./hooks/useAuth";
import { hasSupabaseEnv } from "./supabase";
import { Login } from "./views/Login";
import { Painel } from "./Painel";

export default function App() {
  const { sessao, carregando } = useAuth();

  if (!hasSupabaseEnv) {
    return (
      <main className="login-shell">
        <div className="card login-card">
          <h1>Falta configurar o Supabase</h1>
          <div className="alert">
            Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em um arquivo .env.local.
          </div>
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
