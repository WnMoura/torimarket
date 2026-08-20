import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

const schema = z.object({ tipo: z.enum(["Faturamento R$", "Número de vendas", "Novos clientes"]), descricao: z.string().max(500).default(""), periodo: z.enum(["Diário", "Semanal", "Mensal", "Anual"]), valor_alvo: z.coerce.number().positive() });

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("goals");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new Error("Preencha o tipo, período e valor-alvo da meta.");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("metas").insert({ ...parsed.data, empresa_id: membership.companyId }).select().single();
    if (error) throw error;
    return ok(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
