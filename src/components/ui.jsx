import { X } from "lucide-react";

export function IconButton({ title, onClick, children, danger, type = "button" }) {
  return (
    <button className={`icon-button ${danger ? "danger" : ""}`} title={title} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal show" aria-modal="true" role="dialog">
        <div className="modal-head">
          <h2>{title}</h2>
          <IconButton title="Fechar" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        {children}
      </div>
    </>
  );
}

export function Field({ label, children, full }) {
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

export function Segment({ value, setValue, options }) {
  return (
    <div className="segmented">
      {options.map((opcao) => (
        <button
          key={opcao}
          type="button"
          className={value === opcao ? "active" : ""}
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
