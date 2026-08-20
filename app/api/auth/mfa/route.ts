import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureInitialAdmin } from "@/lib/bootstrap";
import { getMembership } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/http";

const verifySchema = z.object({ factorId: z.string().min(1), challengeId: z.string().min(1).optional(), code: z.string().regex(/^\d{6}$/) });

export async function GET(request: NextRequest) {
  requireSameOrigin(request);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sessão expirada." }, { status: 401 });
  const factors = await supabase.auth.mfa.listFactors();
  const verified = factors.data?.totp?.find((factor) => factor.status === "verified");
  if (verified) return Response.json({ enrolled: true });
  const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Gestor Pro" });
  if (enrolled.error) return Response.json({ error: enrolled.error.message }, { status: 400 });
  return Response.json({ enrolled: false, factorId: enrolled.data.id, qrCode: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret });
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
  await ensureInitialAdmin();
  if (!await getMembership()) return Response.json({ error: "Usuário sem vínculo com uma empresa." }, { status: 403 });
  return Response.json({ ok: true });
}
