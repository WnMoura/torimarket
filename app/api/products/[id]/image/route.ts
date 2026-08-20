import { NextRequest } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { apiError, ok, requireSameOrigin } from "@/lib/http";

const MAX_BYTES = 5 * 1024 * 1024;

function isSupportedImage(bytes: Uint8Array) {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return jpeg || png || webp;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const membership = await requirePermission("products");
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Selecione uma imagem.");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("A imagem deve ter até 5 MB.");
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) throw new Error("Use somente JPEG, PNG ou WebP.");
    const input = Buffer.from(await file.arrayBuffer());
    if (!isSupportedImage(input)) throw new Error("O conteúdo do arquivo não corresponde a uma imagem válida.");
    const output = await sharp(input).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    const objectPath = `${membership.companyId}/${crypto.randomUUID()}.webp`;
    const supabase = await createSupabaseServerClient();
    const uploaded = await supabase.storage.from("produtos").upload(objectPath, output, { contentType: "image/webp", cacheControl: "3600", upsert: false });
    if (uploaded.error) throw uploaded.error;
    const updated = await supabase.from("produtos").update({ foto_url: objectPath, atualizado_em: new Date().toISOString() }).eq("id", id).eq("empresa_id", membership.companyId);
    if (updated.error) throw updated.error;
    return ok({ path: objectPath });
  } catch (error) {
    return apiError(error);
  }
}
