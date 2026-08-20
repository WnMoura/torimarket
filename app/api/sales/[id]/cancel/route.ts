import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { parseBody, cancelSaleSchema } from "@/lib/validation";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    await requirePermission("sales_cancel");
    const { id } = await params;
    const input = parseBody(cancelSaleSchema, await request.json());
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("cancelar_venda", { p_venda_id: id, p_motivo: input.motivo });
    if (error) throw error;
    return ok({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
