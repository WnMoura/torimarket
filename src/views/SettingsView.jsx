import { useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Field, IconButton } from "../components/ui";

const TAXAS = [
  ["taxa_credito", "Taxa Crédito 1x (%)"],
  ["taxa_credito_2x", "Taxa Crédito 2x (%)"],
  ["taxa_credito_3x", "Taxa Crédito 3x (%)"],
  ["taxa_debito", "Taxa Débito (%)"],
  ["taxa_pix", "Taxa Pix (%)"],
  ["taxa_dinheiro", "Taxa Dinheiro (%)"],
];

/**
 * Campo de imagem: prévia do que está gravado (ou do arquivo recém-escolhido), botão de
 * escolher e botão de remover. O `<input type=file>` fica visualmente escondido atrás do
 * botão — o controle nativo não é estilizável — mas segue na árvore de acessibilidade.
 */
function CampoDeImagem({ label, valor, previa, referencia, redondo, aoEscolher, onRemover }) {
  const mostrando = previa || valor;
  const lado = redondo ? 56 : 46;

  return (
    <Field label={label} full group>
      <div className="image-field">
        {mostrando ? (
          <img
            className={redondo ? "avatar-preview" : "thumb"}
            src={mostrando}
            alt=""
            width={lado}
            height={lado}
            decoding="async"
          />
        ) : (
          <div className={`image-placeholder ${redondo ? "redondo" : ""}`} aria-hidden="true" />
        )}

        <div className="image-actions">
          <button className="btn" type="button" onClick={() => referencia.current?.click()}>
            <Upload aria-hidden="true" /> {mostrando ? "Trocar" : "Escolher"}
          </button>

          {mostrando && (
            <IconButton danger title={`Remover ${label.toLowerCase()}`} onClick={onRemover}>
              <Trash2 />
            </IconButton>
          )}
        </div>

        <input
          ref={referencia}
          className="sr-only"
          type="file"
          accept="image/*"
          aria-label={label}
          onChange={aoEscolher}
        />
      </div>
    </Field>
  );
}

export function SettingsView({ settings, salvarConfiguracoes }) {
  const [form, setForm] = useState(settings);
  const [enviando, setEnviando] = useState(false);
  const [previas, setPrevias] = useState({ logo: "", foto: "" });

  const inputLogo = useRef(null);
  const inputFoto = useRef(null);
  const referencias = { logo: inputLogo, foto: inputFoto };

  // O realtime pode trazer configurações novas enquanto a tela está aberta.
  useEffect(() => setForm(settings), [settings]);

  // Object URL só é liberado à mão. Cada prévia é revogada quando é trocada (abaixo) e
  // as que restarem, ao desmontar — daí o ref: o efeito de saída roda uma vez só.
  const previasVivas = useRef(previas);
  previasVivas.current = previas;
  useEffect(() => {
    return () => Object.values(previasVivas.current).forEach((url) => url && URL.revokeObjectURL(url));
  }, []);

  function trocarPrevia(chave, url) {
    setPrevias((atual) => {
      if (atual[chave]) URL.revokeObjectURL(atual[chave]);
      return { ...atual, [chave]: url };
    });
  }

  const alterar = (campo) => (evento) => setForm({ ...form, [campo]: evento.target.value });

  const escolherImagem = (chave) => (evento) => {
    const arquivo = evento.target.files?.[0];
    if (arquivo) trocarPrevia(chave, URL.createObjectURL(arquivo));
  };

  function removerImagem(chave, campo) {
    if (referencias[chave].current) referencias[chave].current.value = "";
    trocarPrevia(chave, "");
    setForm((atual) => ({ ...atual, [campo]: "" }));
  }

  async function enviar(evento) {
    evento.preventDefault();

    setEnviando(true);
    const salvou = await salvarConfiguracoes(form, {
      logo: inputLogo.current?.files?.[0] || null,
      foto: inputFoto.current?.files?.[0] || null,
    });
    setEnviando(false);

    // Gravou: o que vale agora é a URL que voltou do banco, não a prévia local.
    if (salvou) {
      if (inputLogo.current) inputLogo.current.value = "";
      if (inputFoto.current) inputFoto.current.value = "";
      trocarPrevia("logo", "");
      trocarPrevia("foto", "");
    }
  }

  return (
    <form className="card grid" onSubmit={enviar}>
      <h2>Configurações</h2>

      <div className="form-grid">
        <Field label="Nome do negócio">
          <input value={form.nome_negocio || ""} onChange={alterar("nome_negocio")} />
        </Field>

        <Field label="Seu nome">
          <input
            value={form.nome_usuario || ""}
            placeholder="Como você aparece no menu"
            onChange={alterar("nome_usuario")}
          />
        </Field>

        <CampoDeImagem
          label="Sua foto"
          valor={form.foto_usuario}
          previa={previas.foto}
          referencia={inputFoto}
          redondo
          aoEscolher={escolherImagem("foto")}
          onRemover={() => removerImagem("foto", "foto_usuario")}
        />

        <CampoDeImagem
          label="Logo do negócio"
          valor={form.logo_url}
          previa={previas.logo}
          referencia={inputLogo}
          aoEscolher={escolherImagem("logo")}
          onRemover={() => removerImagem("logo", "logo_url")}
        />

        {TAXAS.map(([campo, rotulo]) => (
          <Field key={campo} label={rotulo}>
            <input type="number" step="0.01" value={form[campo] ?? 0} onChange={alterar(campo)} />
          </Field>
        ))}
      </div>

      <button className="btn primary full" type="submit" disabled={enviando}>
        {enviando ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
