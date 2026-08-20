import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function IconButton({ title, onClick, children, danger, type = "button", disabled }) {
  return (
    <button
      className={`icon-button ${danger ? "danger" : ""}`}
      title={title}
      aria-label={title}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * `<dialog>` nativo em vez de div + overlay: ele já traz o Esc, prende o foco dentro,
 * devolve o foco para quem abriu ao fechar e deixa o resto da página inerte.
 */
export function Modal({ title, children, onClose, estreita }) {
  const referencia = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo.open) dialogo.showModal();
    // Sem isto o foco cai no "fechar", que é o primeiro focável do DOM — a modal abriria
    // com o botão de sair aceso. Focar o próprio dialog anuncia o título e deixa o Tab
    // seguir para o primeiro campo.
    dialogo.focus();
    return () => dialogo.close();
  }, []);

  return (
    <dialog
      className={`modal ${estreita ? "estreita" : ""}`}
      ref={referencia}
      tabIndex={-1}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        // Sem o preventDefault o navegador fecha o dialog por fora do React e o estado fica dessincronizado.
        evento.preventDefault();
        onClose();
      }}
      onClick={(evento) => {
        // Clique no backdrop tem como alvo o próprio dialog; no conteúdo, um filho dele.
        if (evento.target === referencia.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={tituloId}>{title}</h2>
        <IconButton title="Fechar" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}

/**
 * Um controle por campo — aí o `<label>` de verdade envolve o que ele rotula.
 * Onde há mais de um controle (quantidade + adicionar, forma + parcelas + valor),
 * `group` troca o label por um grupo rotulado: label só pode apontar para um controle.
 */
export function Field({ label, children, full, group }) {
  const rotuloId = useId();

  if (group) {
    return (
      <div className={`field ${full ? "full" : ""}`} role="group" aria-labelledby={rotuloId}>
        <span id={rotuloId}>{label}</span>
        {children}
      </div>
    );
  }

  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Metric({ label, value, sub, danger }) {
  return (
    <div className={`card metric-card ${danger ? "danger" : ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

export function Segment({ value, setValue, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((opcao) => (
        <button
          key={opcao}
          type="button"
          className={value === opcao ? "active" : ""}
          aria-pressed={value === opcao}
          onClick={() => setValue(opcao)}
        >
          {opcao}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}

/**
 * Esqueleto da tela inicial enquanto o Supabase responde. É a forma do que vem — quatro
 * métricas e dois painéis — em vez de uma frase no meio do vazio: o olho já sabe onde
 * o número vai cair e a página não dá um salto quando ele chega.
 */
export function DashboardSkeleton() {
  return (
    <div className="grid" aria-busy="true" aria-live="polite">
      <p className="sr-only">Carregando os dados do seu negócio…</p>

      <section className="grid metrics">
        {[0, 1, 2, 3].map((i) => (
          <div className="card metric-card" key={i} aria-hidden="true">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-value" />
            <div className="skeleton skeleton-sub" />
          </div>
        ))}
      </section>

      <section className="grid main-grid">
        <div className="card" aria-hidden="true">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-chart" />
        </div>
        <div className="card" aria-hidden="true">
          <div className="skeleton skeleton-title" />
          <div className="list">
            {[0, 1, 2, 3].map((i) => (
              <div className="skeleton skeleton-row" key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
