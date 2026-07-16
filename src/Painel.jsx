import { useState } from "react";
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
import { IconButton } from "./components/ui";
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

const ABAS = [
  ["dashboard", "Início", Grid3X3],
  ["faturamento", "Faturamento", Wallet],
  ["pricing", "Precificação", Tag],
  ["stock", "Produtos & Estoque", Boxes],
  ["clients", "Clientes", Users],
  ["goals", "Metas", Target],
  ["cash", "Fluxo de Caixa", FileText],
  ["dre", "DRE", BarChart3],
  ["insights", "Insights", Lightbulb],
  ["settings", "Configurações", Settings],
];

export function Painel({ email }) {
  const store = useStore();

  const [aba, setAba] = useState("dashboard");
  const [menuAberto, setMenuAberto] = useState(false);
  const [modal, setModal] = useState(null);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
  const [vendaEmEdicao, setVendaEmEdicao] = useState(null);
  const [periodo, setPeriodo] = useState(currentMonth());

  const titulo = ABAS.find(([id]) => id === aba)?.[1] || "Início";

  function fecharModal() {
    setModal(null);
    setClienteEmEdicao(null);
    setVendaEmEdicao(null);
  }

  function editarVenda(venda) {
    setVendaEmEdicao(venda);
    setModal("editSale");
  }

  return (
    <>
      <aside className={`sidebar ${menuAberto ? "open" : ""}`}>
        <button
          className="sidebar-close"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        >
          <X />
        </button>

        <div className="profile">
          <div className="avatar">
            {(store.settings.nome_usuario || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="grow">
            <strong>{store.settings.nome_usuario}</strong>
            <span>{email}</span>
          </div>
          <IconButton title="Sair" onClick={sair}>
            <LogOut />
          </IconButton>
        </div>

        <nav>
          {ABAS.map(([id, rotulo, Icone]) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${aba === id ? "active" : ""}`}
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
            onClick={() => setMenuAberto(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <p className="eyebrow">Empresa Gestor Pro</p>
            <h1>{titulo}</h1>
          </div>
          <div className="business-name">
            {store.settings.logo_url && (
              <img
                src={store.settings.logo_url}
                alt=""
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }}
              />
            )}
            {store.settings.nome_negocio}
          </div>
        </header>

        {store.error && <div className="alert">{store.error}</div>}
        {store.aviso && <div className="alert">{store.aviso}</div>}

        {store.loading ? (
          <div className="card empty">Carregando dados do Supabase...</div>
        ) : (
          <>
            {aba === "dashboard" && (
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

            {aba === "pricing" && (
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

            {aba === "stock" && (
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

            {aba === "clients" && (
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

            {aba === "goals" && (
              <Goals
                goals={store.goals}
                sales={store.sales}
                clients={store.clients}
                excluir={store.excluir}
                onNova={() => setModal("goal")}
              />
            )}

            {aba === "cash" && (
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

            {aba === "settings" && (
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
