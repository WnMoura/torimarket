import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { parseBody, clientSchema } from "@/lib/validation";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("clients");
    const input = parseBody(clientSchema, await request.json());
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("clientes").insert({ ...input, empresa_id: membership.companyId, criado_por: membership.userId }).select().single();
    if (error) throw error;
    return ok(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
