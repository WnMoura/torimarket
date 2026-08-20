import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./ui";

/**
 * Confirmação destrutiva dentro do app, no lugar do `confirm()` do navegador.
 *
 * O nativo funciona, mas é a única superfície do sistema fora da linguagem visual:
 * sai em tema claro, não formata a consequência e no celular vira uma folha do sistema
 * operacional. Aqui a pergunta usa a mesma modal, a mesma tipografia e o mesmo botão
 * destrutivo de contorno do resto.
 *
 *   const [confirmar, dialogo] = useConfirmacao();
 *   if (await confirmar({ titulo, mensagem, rotulo })) ...
 *   return <>{dialogo}...</>
 */
export function useConfirmacao() {
  const [pedido, setPedido] = useState(null);

  const confirmar = useCallback(
    (opcoes) => new Promise((resolver) => setPedido({ ...opcoes, resolver })),
    [],
  );

  function responder(resposta) {
    pedido?.resolver(resposta);
    setPedido(null);
  }

  const dialogo = pedido ? (
    <DialogoDeConfirmacao
      titulo={pedido.titulo}
      mensagem={pedido.mensagem}
      rotulo={pedido.rotulo || "Excluir"}
      onResponder={responder}
    />
  ) : null;

  return [confirmar, dialogo];
}

function DialogoDeConfirmacao({ titulo, mensagem, rotulo, onResponder }) {
  const botaoCancelar = useRef(null);

  // Numa pergunta destrutiva o foco começa em "Cancelar": um Enter distraído não
  // deve apagar venda nenhuma.
  useEffect(() => botaoCancelar.current?.focus(), []);

  return (
    <Modal title={titulo} estreita onClose={() => onResponder(false)}>
      <p className="confirm-message">{mensagem}</p>

      <div className="confirm-actions">
        <button className="btn" type="button" ref={botaoCancelar} onClick={() => onResponder(false)}>
          Cancelar
        </button>
        <button className="btn danger" type="button" onClick={() => onResponder(true)}>
          {rotulo}
        </button>
      </div>
    </Modal>
  );
}
