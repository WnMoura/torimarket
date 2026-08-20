const PREFIXO_PUBLICO = "/storage/v1/object/public/produtos/";

/**
 * Caminho do arquivo dentro do bucket, a partir da URL pública que o storage devolveu.
 * Devolve null quando a URL não é do bucket (produto sem foto, ou foto de origem externa)
 * — nesse caso não há nada para apagar.
 */
export function caminhoDaFoto(fotoUrl) {
  const inicio = String(fotoUrl || "").indexOf(PREFIXO_PUBLICO);
  if (inicio === -1) return null;

  const caminho = String(fotoUrl).slice(inicio + PREFIXO_PUBLICO.length).split("?")[0];
  return caminho ? decodeURIComponent(caminho) : null;
}

/** Regra única de "este produto está ativo?". Antes da migração 002 a coluna não existe. */
export const produtoAtivo = (produto) => produto?.ativo !== false;
