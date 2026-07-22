import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Boxes,
  FileText,
  Grid3X3,
  Lightbulb,
  LogOut,
  Settings,
  Tag,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useStore } from "./hooks/useStore";
import { sair } from "./hooks/useAuth";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useRota, useVoltarFechaModal } from "./hooks/useRota";
import { DashboardSkeleton, IconButton } from "./components/ui";
import { currentMonth } from "./lib/format";
import { Cash } from "./views/Cash";
import { Clients } from "./views/Clients";
import { Dashboard } from "./views/Dashboard";
import { Dre } from "./views/Dre";
import { Faturamento } from "./views/Faturamento";
import { Goals } from "./views/Goals";
import { Insights } from "./views/Insights";
import { Pricing } from "./views/Pricing";
import { SettingsView } from "./views/SettingsView";
import { Stock } from "./views/Stock";
import { ClientModal } from "./modals/ClientModal";
import { EditSaleModal } from "./modals/EditSaleModal";
import { GoalModal } from "./modals/GoalModal";
import { SaleModal } from "./modals/SaleModal";

// O primeiro item é o slug que aparece na URL — legível, em português, e estável:
// é o que o dono vê ao favoritar uma tela.
const ABAS = [
  ["inicio", "Início", Grid3X3],
  ["faturamento", "Faturamento", Wallet],
  ["precificacao", "Precificação", Tag],
  ["estoque", "Produtos & Estoque", Boxes],
  ["clientes", "Clientes", Users],
  ["metas", "Metas", Target],
  ["caixa", "Fluxo de Caixa", FileText],
  ["dre", "DRE", BarChart3],
  ["insights", "Insights", Lightbulb],
  ["configuracoes", "Configurações", Settings],
];

const ABA_PADRAO = "inicio";

export function Painel({ email }) {
  const store = useStore();

  const [aba, setAba] = useRota(ABA_PADRAO);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modal, setModal] = useState(null);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
  const [vendaEmEdicao, setVendaEmEdicao] = useState(null);
  const [periodo, setPeriodo] = useState(currentMonth());

  const titulo = ABAS.find(([id]) => id === aba)?.[1] || "Início";

  // A aba da vez também é o nome da janela — importa em quem trabalha com várias abertas.
  useEffect(() => {
    document.title = `${titulo} · Empresa Gestor Pro`;
  }, [titulo]);

  // Abaixo de 760px a barra lateral vira gaveta: fechada, ela sai da tela e precisa
  // sair junto da ordem de tabulação — senão são 10 destinos invisíveis antes do conteúdo.
  const ehMobile = useMediaQuery("(max-width: 760px)");
  const gavetaOculta = ehMobile && !menuAberto;

  const botaoMenu = useRef(null);
  const botaoFechar = useRef(null);
  const jaMontou = useRef(false);

  // Abrir leva o foco para dentro da gaveta; fechar devolve para o hambúrguer.
  // Na primeira renderização não mexe em nada: ninguém pediu foco ainda.
  useEffect(() => {
    if (!jaMontou.current) {
      jaMontou.current = true;
      return;
    }
    if (!ehMobile) return;
    if (menuAberto) botaoFechar.current?.focus();
    else botaoMenu.current?.focus();
  }, [menuAberto, ehMobile]);

  // A gaveta é uma camada sobreposta, e camada sobreposta fecha no Esc.
  useEffect(() => {
    if (!menuAberto) return undefined;
    const aoTeclar = (evento) => evento.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [menuAberto]);

  function fecharModal() {
    setModal(null);
    setClienteEmEdicao(null);
    setVendaEmEdicao(null);
  }

  useVoltarFechaModal(Boolean(modal), fecharModal);

  function editarVenda(venda) {
    setVendaEmEdicao(venda);
    setModal("editSale");
  }

  return (
    <>
      <aside
        id="menu-lateral"
        className={`sidebar ${menuAberto ? "open" : ""}`}
        inert={gavetaOculta}
      >
        <button
          className="sidebar-close"
          type="button"
          ref={botaoFechar}
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        >
          <X />
        </button>

        <div className="profile">
          {store.settings.foto_usuario ? (
            <img
              className="avatar"
              src={store.settings.foto_usuario}
              alt=""
              width={44}
              height={44}
              decoding="async"
            />
          ) : (
            <div className="avatar">
              {(store.settings.nome_usuario || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="grow">
            <strong title={store.settings.nome_usuario}>{store.settings.nome_usuario}</strong>
            <span title={email}>{email}</span>
          </div>
          <IconButton title="Sair" onClick={sair}>
            <LogOut />
          </IconButton>
        </div>

        <nav aria-label="Telas do sistema">
          {ABAS.map(([id, rotulo, Icone]) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${aba === id ? "active" : ""}`}
              aria-current={aba === id ? "page" : undefined}
              onClick={() => {
                setAba(id);
                setMenuAberto(false);
              }}
            >
              <Icone /> {rotulo}
            </button>
          ))}
        </nav>
      </aside>

      {menuAberto && (
        <div className="sidebar-overlay" onClick={() => setMenuAberto(false)} />
      )}

      <main className="app-shell">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            type="button"
            ref={botaoMenu}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            aria-controls="menu-lateral"
            onClick={() => setMenuAberto(true)}
          >
            <span />
            <span />
            <span />
          </button>
          {/*
            No desktop a barra lateral já diz em que tela você está — item aceso e
            aria-current. Repetir o nome no topo é ruído. O h1 continua existindo para
            leitor de tela e para o celular, onde a navegação some dentro da gaveta.
          */}
          <div>
            <h1 className={ehMobile ? "" : "sr-only"}>{titulo}</h1>
          </div>
          <div className="business-name">
            {store.settings.logo_url && (
              <img
                className="business-logo"
                src={store.settings.logo_url}
                alt=""
                width={28}
                height={28}
                decoding="async"
              />
            )}
            {store.settings.nome_negocio}
          </div>
        </header>

        {store.error && (
          <div className="alert" role="alert">
            {store.error}
          </div>
        )}
        {store.aviso && (
          <div className="alert" role="status">
            {store.aviso}
          </div>
        )}

        {store.loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {aba === "inicio" && (
              <Dashboard
                sales={store.sales}
                items={store.items}
                products={store.products}
                clients={store.clients}
                settings={store.settings}
                excluirVenda={store.excluirVenda}
                onEditarVenda={editarVenda}
              />
            )}

            {aba === "faturamento" && (
              <Faturamento sales={store.sales} items={store.items} settings={store.settings} />
            )}

            {aba === "precificacao" && (
              <Pricing
                products={store.products}
                archivedProducts={store.archivedProducts}
                items={store.items}
                settings={store.settings}
                salvarProduto={store.salvarProduto}
                excluirProduto={store.excluirProduto}
                arquivarProduto={store.arquivarProduto}
              />
            )}

            {aba === "estoque" && (
              <Stock
                products={store.products}
                sales={store.sales}
                items={store.items}
                clients={store.clients}
                onNovaVenda={() => setModal("sale")}
                excluirVenda={store.excluirVenda}
                onEditarVenda={editarVenda}
              />
            )}

            {aba === "clientes" && (
              <Clients
                clients={store.clients}
                excluir={store.excluir}
                onNovo={() => {
                  setClienteEmEdicao(null);
                  setModal("client");
                }}
                onEditar={(cliente) => {
                  setClienteEmEdicao(cliente);
                  setModal("client");
                }}
              />
            )}

            {aba === "metas" && (
              <Goals
                goals={store.goals}
                sales={store.sales}
                clients={store.clients}
                excluir={store.excluir}
                onNova={() => setModal("goal")}
              />
            )}

            {aba === "caixa" && (
              <Cash
                sales={store.sales}
                cash={store.cash}
                periodo={periodo}
                setPeriodo={setPeriodo}
                salvarLancamento={store.salvarLancamento}
                excluir={store.excluir}
                excluirVenda={store.excluirVenda}
              />
            )}

            {aba === "dre" && (
              <Dre
                sales={store.sales}
                items={store.items}
                settings={store.settings}
                periodo={periodo}
                setPeriodo={setPeriodo}
              />
            )}

            {aba === "insights" && <Insights sales={store.sales} items={store.items} />}

            {aba === "configuracoes" && (
              <SettingsView
                settings={store.settings}
                salvarConfiguracoes={store.salvarConfiguracoes}
              />
            )}
          </>
        )}

        {modal === "sale" && (
          <SaleModal
            products={store.products}
            clients={store.clients}
            registrarVenda={store.registrarVenda}
            onError={store.setError}
            onClose={fecharModal}
          />
        )}

        {modal === "client" && (
          <ClientModal
            cliente={clienteEmEdicao}
            salvarCliente={store.salvarCliente}
            onClose={fecharModal}
          />
        )}

        {modal === "goal" && (
          <GoalModal salvarMeta={store.salvarMeta} onError={store.setError} onClose={fecharModal} />
        )}

        {modal === "editSale" && vendaEmEdicao && (
          <EditSaleModal
            venda={vendaEmEdicao}
            clients={store.clients}
            editarVenda={store.editarVenda}
            onError={store.setError}
            onClose={fecharModal}
          />
        )}
      </main>
    </>
  );
}
