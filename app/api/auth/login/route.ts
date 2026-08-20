import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { allowRequest } from "@/lib/rate-limit";
import { getMembership } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/http";

const schema = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

export async function POST(request: NextRequest) {
  requireSameOrigin(request);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(`login:${ip}`)) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Informe um email e uma senha válidos." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(body.data);
  if (error) return Response.json({ error: "Email ou senha inválidos." }, { status: 401 });

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal) return Response.json({ error: "Não foi possível verificar o nível de segurança." }, { status: 401 });
  const factors = await supabase.auth.mfa.listFactors();
  const verifiedFactor = factors.data?.totp?.find((factor) => factor.status === "verified");
  if (!verifiedFactor) return Response.json({ mfaEnrollmentRequired: true });
  if (aal.currentLevel !== "aal2" && aal.nextLevel === "aal2") {
    const challenge = await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });
    if (challenge.error) return Response.json({ error: "Não foi possível iniciar a verificação MFA." }, { status: 401 });
    return Response.json({ mfaRequired: true, factorId: verifiedFactor.id, challengeId: challenge.data.id });
  }
  try {
    if (!await getMembership()) return Response.json({ error: "Não foi possível liberar o acesso à Tori." }, { status: 403 });
  } catch (membershipError) {
    const message = membershipError instanceof Error ? membershipError.message : "Não foi possível liberar o acesso à Tori.";
    return Response.json({ error: message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
