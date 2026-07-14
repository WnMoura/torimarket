import { useState } from "react";
import { Field } from "../components/ui";
import { entrar, traduzirErroDeLogin } from "../hooks/useAuth";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");
    setEntrando(true);

    try {
      await entrar(email.trim(), senha);
      // Não precisa navegar: o onAuthStateChange do useAuth troca a tela sozinho.
    } catch (e) {
      setErro(traduzirErroDeLogin(e));
      setEntrando(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="card login-card" onSubmit={enviar}>
        <div>
          <p className="eyebrow">Empresa Gestor Pro</p>
          <h1>Entrar</h1>
        </div>

        {erro && <div className="alert">{erro}</div>}

        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </Field>

        <Field label="Senha">
          <input
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        <button className="btn primary full" type="submit" disabled={entrando}>
          {entrando ? "Entrando..." : "Entrar"}
        </button>

        <p className="muted">
          Não há cadastro aberto: os acessos são criados pelo administrador no painel do Supabase.
        </p>
      </form>
    </main>
  );
}
