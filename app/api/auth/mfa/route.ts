import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/http";

const verifySchema = z.object({ factorId: z.string().min(1), challengeId: z.string().min(1).optional(), code: z.string().regex(/^\d{6}$/) });

export async function GET(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return Response.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });

    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) return Response.json({ error: "Não foi possível consultar o autenticador." }, { status: 400 });

    const verified = factors.data?.totp?.find((factor) => factor.status === "verified");
    if (verified) {
      const challenge = await supabase.auth.mfa.challenge({ factorId: verified.id });
      if (challenge.error) return Response.json({ error: "Não foi possível iniciar o desafio MFA." }, { status: 400 });
      return Response.json({ mode: "challenge", factorId: verified.id, challengeId: challenge.data.id });
    }

    const unverified = factors.data?.all?.filter(
      (factor) => factor.factor_type === "totp" && factor.status === "unverified",
    ) || [];
    await Promise.all(unverified.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })));

    const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Tori Gestão" });
    if (enrolled.error) return Response.json({ error: "Não foi possível cadastrar o autenticador." }, { status: 400 });
    return Response.json({
      mode: "enroll",
      factorId: enrolled.data.id,
      qrCode: enrolled.data.totp.qr_code,
      secret: enrolled.data.totp.secret,
    });
  } catch {
    return Response.json({ error: "Não foi possível preparar a verificação MFA." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  requireSameOrigin(request);
  const body = verifySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Código MFA inválido." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const challengeId = body.data.challengeId || (await supabase.auth.mfa.challenge({ factorId: body.data.factorId })).data?.id;
  if (!challengeId) return Response.json({ error: "Não foi possível iniciar o desafio MFA." }, { status: 400 });
  const verified = await supabase.auth.mfa.verify({ factorId: body.data.factorId, challengeId, code: body.data.code });
  if (verified.error) return Response.json({ error: "Código MFA incorreto." }, { status: 401 });
  try {
    if (!await getMembership(supabase)) return Response.json({ error: "Não foi possível liberar o acesso à Tori." }, { status: 403 });
  } catch (membershipError) {
    const message = membershipError instanceof Error ? membershipError.message : "Não foi possível liberar o acesso à Tori.";
    return Response.json({ error: message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
