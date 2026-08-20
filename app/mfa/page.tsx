"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";

export default function MfaPage() {
  const [setup, setSetup] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [challenge, setChallenge] = useState<{ factorId: string; challengeId?: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const isChallenge = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("challenge") === "1";

  useEffect(() => {
    const stored = sessionStorage.getItem("gestor_mfa");
    if (stored) setChallenge(JSON.parse(stored));
    if (isChallenge) return setLoading(false);
    fetch("/api/auth/mfa").then((response) => response.json()).then((result) => {
      if (result.enrolled) window.location.assign("/login");
      else setSetup({ factorId: result.factorId, qrCode: result.qrCode, secret: result.secret });
    }).catch(() => setError("Não foi possível iniciar o cadastro do MFA."))
      .finally(() => setLoading(false));
  }, [isChallenge]);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setError("");
    const factorId = challenge?.factorId || setup?.factorId;
    if (!factorId) return setError("Fator MFA não encontrado.");
    setLoading(true);
    const response = await fetch("/api/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ factorId, challengeId: challenge?.challengeId, code }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(result.error || "Código inválido.");
    sessionStorage.removeItem("gestor_mfa");
    window.location.assign("/dashboard");
  }

  return <main className="auth-page"><section className="auth-panel narrow"><button className="button button-ghost" onClick={() => window.location.assign("/login")}><ArrowLeft size={16} /> Voltar</button><div className="brand-mark">T</div><p className="eyebrow">Tori · Proteção em duas etapas</p><h1>{isChallenge ? "Confirme seu acesso." : "Configure seu autenticador."}</h1>{loading ? <p className="auth-copy">Preparando verificação...</p> : <><p className="auth-copy">Use um aplicativo autenticador para gerar o código de seis dígitos.</p>{setup && <div className="mfa-setup"><img src={setup.qrCode} alt="QR Code para configurar o autenticador" /><code>{setup.secret}</code></div>}<form onSubmit={verify} className="auth-form"><label className="field"><span>Código de 6 dígitos</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-large" disabled={loading}>{setup ? "Ativar MFA" : "Verificar código"}<KeyRound size={18} /></button></form></>}<div className="auth-trust"><ShieldCheck size={17} /><span>A Tori exige MFA em todos os acessos</span></div></section></main>;
}
