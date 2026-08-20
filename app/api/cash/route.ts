import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

const schema = z.object({ tipo: z.enum(["entrada", "saída"]), descricao: z.string().trim().min(2).max(180), valor: z.coerce.number().positive(), data: z.string().date() });

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("cash");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new Error("Preencha corretamente o lançamento.");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("lancamentos").insert({ ...parsed.data, empresa_id: membership.companyId }).select().single();
    if (error) throw error;
    return ok(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
