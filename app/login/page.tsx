"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(result.error || "Não foi possível entrar.");
    if (result.mfaEnrollmentRequired) return window.location.assign("/mfa");
    if (result.mfaRequired) {
      sessionStorage.setItem("gestor_mfa", JSON.stringify({ factorId: result.factorId, challengeId: result.challengeId }));
      return window.location.assign("/mfa?challenge=1");
    }
    window.location.assign("/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-mark">T</div>
        <p className="eyebrow">Tori · Painel de gestão</p>
        <h1>A Tori por inteiro, em um só lugar.</h1>
        <p className="auth-copy">Vendas, estoque, clientes e resultados com acesso protegido para a equipe.</p>
        <form onSubmit={submit} className="auth-form">
          <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@tori.com.br" required /></label>
          <label className="field"><span>Senha</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" minLength={8} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-large" disabled={loading}>{loading ? "Verificando..." : "Entrar"}<ArrowRight size={18} /></button>
        </form>
        <div className="auth-trust"><ShieldCheck size={17} /><span>MFA obrigatório e sessão protegida</span><LockKeyhole size={17} /></div>
      </section>
      <aside className="auth-aside"><div className="aside-line" /><p>Moda em movimento.</p><strong>Gestão para crescer.</strong><span>A operação da Tori organizada, segura e pronta para o próximo passo.</span></aside>
    </main>
  );
}
