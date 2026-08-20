import { useEffect, useState } from "react";

/**
 * Rota no hash (`#/estoque`), não no caminho: funciona em qualquer hospedagem
 * estática sem regra de rewrite, e é o que o Vercel serve hoje.
 */
function rotaAtual(padrao) {
  const slug = window.location.hash.replace(/^#\/?/, "").split("/")[0];
  return slug || padrao;
}

export function useRota(padrao) {
  const [rota, setRota] = useState(() => rotaAtual(padrao));

  useEffect(() => {
    const aoNavegar = () => setRota(rotaAtual(padrao));
    window.addEventListener("hashchange", aoNavegar);
    return () => window.removeEventListener("hashchange", aoNavegar);
  }, [padrao]);

  // Trocar de tela é navegação: entra no histórico e o botão voltar desfaz.
  const irPara = (slug) => {
    if (rotaAtual(padrao) === slug) return;
    window.location.hash = `#/${slug}`;
  };

  return [rota, irPara];
}

/**
 * Enquanto a modal está aberta, uma entrada a mais no histórico. Assim o "voltar"
 * do Android fecha a modal em vez de sair do app — e fechar pela UI desfaz a entrada.
 */
export function useVoltarFechaModal(aberta, fechar) {
  useEffect(() => {
    if (!aberta) return undefined;

    window.history.pushState({ modalAberta: true }, "");

    const aoVoltar = () => fechar();
    window.addEventListener("popstate", aoVoltar);

    return () => {
      window.removeEventListener("popstate", aoVoltar);
      // Só desfaz se a entrada ainda for nossa: se veio de um popstate, ela já saiu.
      if (window.history.state?.modalAberta) window.history.back();
    };
    // `fechar` é recriada a cada render; o efeito só deve reagir à modal abrir/fechar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberta]);
}
