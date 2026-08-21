"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";

type MfaSetup = { factorId: string; qrCode: string; secret: string };
type MfaChallenge = { factorId: string; challengeId: string };

function readStoredChallenge(): MfaChallenge | null {
  try {
    const stored = sessionStorage.getItem("gestor_mfa");
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<MfaChallenge>;
    if (typeof parsed.factorId !== "string" || typeof parsed.challengeId !== "string") return null;
    return { factorId: parsed.factorId, challengeId: parsed.challengeId };
  } catch {
    sessionStorage.removeItem("gestor_mfa");
    return null;
  }
}

export default function MfaPage() {
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const initialLoadStarted = useRef(false);

  const prepareMfa = useCallback(async () => {
    setLoading(true);
    setError("");
    setSetup(null);

    const canReuseChallenge = new URLSearchParams(window.location.search).get("challenge") === "1";
    const storedChallenge = canReuseChallenge ? readStoredChallenge() : null;
    if (!canReuseChallenge) sessionStorage.removeItem("gestor_mfa");
    if (storedChallenge) {
      setChallenge(storedChallenge);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/auth/mfa", {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(result.error || "Não foi possível preparar a verificação MFA.");

      if (result.mode === "challenge" && result.factorId && result.challengeId) {
        const nextChallenge = { factorId: result.factorId, challengeId: result.challengeId };
        sessionStorage.setItem("gestor_mfa", JSON.stringify(nextChallenge));
        setChallenge(nextChallenge);
        return;
      }

      if (result.mode === "enroll" && result.factorId && result.qrCode && result.secret) {
        setChallenge(null);
        setSetup({ factorId: result.factorId, qrCode: result.qrCode, secret: result.secret });
        return;
      }

      throw new Error("O servidor retornou uma configuração MFA incompleta.");
    } catch (requestError) {
      const message = requestError instanceof DOMException && requestError.name === "AbortError"
        ? "A verificação demorou demais. Tente novamente."
        : requestError instanceof Error
          ? requestError.message
          : "Não foi possível iniciar a verificação MFA.";
      setChallenge(null);
      setError(message);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    void prepareMfa();
  }, [prepareMfa]);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setError("");
    const factorId = challenge?.factorId || setup?.factorId;
    if (!factorId) return setError("Fator MFA não encontrado. Prepare a verificação novamente.");

    setLoading(true);
    try {
      const response = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId, challengeId: challenge?.challengeId, code }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setError(result.error || "Código inválido.");
      sessionStorage.removeItem("gestor_mfa");
      window.location.assign("/dashboard");
    } catch {
      setError("Não foi possível confirmar o código. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const isChallenge = Boolean(challenge);

  return (
    <main className="auth-page">
      <section className="auth-panel narrow">
        <button className="button button-ghost" onClick={() => window.location.assign("/login")}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="brand-mark">T</div>
        <p className="eyebrow">Tori · Proteção em duas etapas</p>
        <h1>{isChallenge ? "Confirme seu acesso." : "Configure seu autenticador."}</h1>

        {loading ? (
          <p className="auth-copy">Preparando verificação...</p>
        ) : error && !setup && !challenge ? (
          <div className="auth-form">
            <p className="form-error" role="alert">{error}</p>
            <button className="button button-primary button-large" onClick={() => void prepareMfa()}>
              Tentar novamente <RefreshCw size={18} />
            </button>
          </div>
        ) : (
          <>
            <p className="auth-copy">Use um aplicativo autenticador para gerar o código de seis dígitos.</p>
            {setup && (
              <div className="mfa-setup">
                <img src={setup.qrCode} alt="QR Code para configurar o autenticador" />
                <code>{setup.secret}</code>
              </div>
            )}
            <form onSubmit={verify} className="auth-form">
              <label className="field">
                <span>Código de 6 dígitos</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-primary button-large" disabled={loading || code.length !== 6}>
                {setup ? "Ativar MFA" : "Verificar código"} <KeyRound size={18} />
              </button>
            </form>
          </>
        )}

        <div className="auth-trust">
          <ShieldCheck size={17} />
          <span>A Tori exige MFA em todos os acessos</span>
        </div>
      </section>
    </main>
  );
}
