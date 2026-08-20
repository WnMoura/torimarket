import { NextResponse } from "next/server";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new Error("Origem inválida.");
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Não foi possível concluir a operação.";
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  if (message === "MFA_REQUIRED") return NextResponse.json({ error: "Verificação MFA necessária." }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Você não tem permissão para esta ação." }, { status: 403 });
  return NextResponse.json({ error: message }, { status: 400 });
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}
