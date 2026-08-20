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
        <div className="brand-mark">GP</div>
        <p className="eyebrow">Empresa Gestor Pro</p>
        <h1>Acesso seguro ao seu negócio.</h1>
        <p className="auth-copy">Controle vendas, estoque e resultado em um só lugar, com cada ação protegida por função.</p>
        <form onSubmit={submit} className="auth-form">
          <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" required /></label>
          <label className="field"><span>Senha</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" minLength={8} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-large" disabled={loading}>{loading ? "Verificando..." : "Entrar"}<ArrowRight size={18} /></button>
        </form>
        <div className="auth-trust"><ShieldCheck size={17} /><span>MFA obrigatório e sessão protegida</span><LockKeyhole size={17} /></div>
      </section>
      <aside className="auth-aside"><div className="aside-line" /><p>Clareza para decidir.</p><strong>Ritmo para crescer.</strong><span>Seu painel operacional, agora com segurança de verdade.</span></aside>
    </main>
  );
}
