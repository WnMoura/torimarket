import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  Boxes,
  FileText,
  Grid3X3,
  Lightbulb,
  Pencil,
  Plus,
  Settings,
  Tag,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { hasSupabaseEnv, supabase } from "./supabase";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtMoney = (v) => money.format(Number(v || 0));
const num = (v) => Number(v || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const dateBR = (v) => (v ? new Date(v).toLocaleDateString("pt-BR") : "-");
const monthKey = (v) => new Date(v).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

const tabs = [
  ["dashboard", "Início", Grid3X3],
  ["pricing", "Precificação", Tag],
  ["stock", "Produtos & Estoque", Boxes],
  ["clients", "Clientes", Users],
  ["goals", "Metas", Target],
  ["cash", "Fluxo de Caixa", FileText],
  ["dre", "DRE", BarChart3],
  ["insights", "Insights", Lightbulb],
  ["settings", "Configurações", Settings],
];

const emptyProduct = {
  nome: "",
  categoria: "",
  foto_url: "",
  custo: 0,
  custos_variaveis: 0,
  frete: 0,
  margem_desejada: 40,
  preco_sugerido: 0,
  preco_final: 0,
  estoque: 0,
  tamanhos: "P,M,G,GG",
  descricao: "",
};

const emptyClient = { nome: "", contato: "", email: "", preferencias: "", observacoes: "" };
const emptyGoal = { tipo: "Faturamento R$", descricao: "", periodo: "Mensal", valor_alvo: 0 };
const emptySettings = {
  id: 1,
  nome_negocio: "Meu negócio",
  nome_usuario: "Usuário",
  taxa_credito: 4.5,
  taxa_debito: 2,
  taxa_pix: 0,
  taxa_dinheiro: 0,
};

function IconButton({ title, onClick, children, danger }) {
  return (
    <button className={`icon-button ${danger ? "danger" : ""}`} title={title} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="modal show" aria-modal="true" role="dialog">
        <div className="modal-head">
          <h2>{title}</h2>
          <IconButton title="Fechar" onClick={onClose}><X /></IconButton>
        </div>
        {children}
      </div>
    </>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [cash, setCash] = useState([]);
  const [settings, setSettings] = useState(emptySettings);
  const [modal, setModal] = useState(null);
  const [chartMode, setChartMode] = useState("Dia");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [editingClient, setEditingClient] = useState(null);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [stockFilters, setStockFilters] = useState({ category: "", status: "", sort: "nome" });
  const [clientSearch, setClientSearch] = useState("");
  const [saleForm, setSaleForm] = useState({
    cliente_id: "",
    nome_cliente: "",
    contato: "",
    forma_pagamento: "Pix",
    observacoes: "",
    produto_id: "",
    quantidade: 1,
    itens: [],
  });
  const [cashForm, setCashForm] = useState({ tipo: "saída", descricao: "", valor: 0, data: todayISO() });
  const [period, setPeriod] = useState(todayISO().slice(0, 7));

  const pageTitle = tabs.find(([id]) => id === active)?.[1] || "Início";

  async function loadAll() {
    if (!hasSupabaseEnv) {
      setLoading(false);
      setError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em um arquivo .env.local.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [p, c, v, i, m, cfg, l] = await Promise.all([
        supabase.from("produtos").select("*").order("criado_em", { ascending: false }),
        supabase.from("clientes").select("*").order("criado_em", { ascending: false }),
        supabase.from("vendas").select("*, clientes(nome), itens_venda(*, produtos(nome, custo, preco_final))").order("criado_em", { ascending: false }),
        supabase.from("itens_venda").select("*, produtos(nome, custo, preco_final)"),
        supabase.from("metas").select("*").order("criado_em", { ascending: false }),
        supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle(),
        supabase.from("lancamentos").select("*").order("data", { ascending: false }),
      ]);
      for (const result of [p, c, v, i, m, cfg, l]) if (result.error) throw result.error;
      setProducts(p.data || []);
      setClients(c.data || []);
      setSales(v.data || []);
      setItems(i.data || []);
      setGoals(m.data || []);
      setSettings(cfg.data || emptySettings);
      setCash(l.data || []);
    } catch (err) {
      setError(err.message || "Erro ao carregar dados do Supabase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    if (!hasSupabaseEnv) return;
    const channel = supabase
      .channel("empresa-gestor-pro")
      .on("postgres_changes", { event: "*", schema: "public" }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const todaySales = useMemo(() => sales.filter((s) => String(s.criado_em).startsWith(todayISO())), [sales]);
  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const totals = useMemo(() => {
    const todayIds = new Set(todaySales.map((s) => s.id));
    const todayItems = items.filter((it) => todayIds.has(it.venda_id));
    const revenue = todaySales.reduce((sum, s) => sum + num(s.total), 0);
    const cost = todayItems.reduce((sum, it) => sum + num(it.quantidade) * num(it.produtos?.custo || productById[it.produto_id]?.custo), 0);
    const fees = todaySales.reduce((sum, s) => sum + num(s.total) * (paymentRate(s.forma_pagamento) / 100), 0);
    const stockValue = products.reduce((sum, p) => sum + num(p.preco_final) * num(p.estoque), 0);
    return { revenue, cost, gross: revenue - cost, fees, net: revenue - cost - fees, stockValue };
  }, [todaySales, items, products, settings]);

  function paymentRate(method) {
    const key = {
      Crédito: "taxa_credito",
      Débito: "taxa_debito",
      Pix: "taxa_pix",
      Dinheiro: "taxa_dinheiro",
    }[method];
    return num(settings[key]);
  }

  function productSuggested(form = productForm) {
    const base = num(form.custo) + num(form.custos_variaveis) + num(form.frete);
    const margin = Math.min(99, Math.max(0, num(form.margem_desejada)));
    return margin >= 100 ? 0 : base / (1 - margin / 100);
  }

  function realMargin(form = productForm) {
    const price = num(form.preco_final);
    if (!price) return 0;
    const base = num(form.custo) + num(form.custos_variaveis) + num(form.frete);
    return ((price - base) / price) * 100;
  }

  async function uploadPhoto(file) {
    if (!file) return productForm.foto_url || "";
    const path = `${crypto.randomUUID()}-${file.name}`;
    const up = await supabase.storage.from("produtos").upload(path, file);
    if (up.error) throw up.error;
    return supabase.storage.from("produtos").getPublicUrl(path).data.publicUrl;
  }

  async function saveProduct(e) {
    e.preventDefault();
    setError("");
    try {
      const file = e.currentTarget.foto.files?.[0];
      const foto_url = await uploadPhoto(file);
      const payload = {
        ...productForm,
        foto_url,
        preco_sugerido: productSuggested(productForm),
        custo: num(productForm.custo),
        custos_variaveis: num(productForm.custos_variaveis),
        frete: num(productForm.frete),
        margem_desejada: num(productForm.margem_desejada),
        preco_final: num(productForm.preco_final || productSuggested(productForm)),
        estoque: Math.floor(num(productForm.estoque)),
      };
      const query = editingProduct
        ? supabase.from("produtos").update(payload).eq("id", editingProduct)
        : supabase.from("produtos").insert(payload);
      const { error: err } = await query;
      if (err) throw err;
      setProductForm(emptyProduct);
      setEditingProduct(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRow(table, id) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    const { error: err } = await supabase.from(table).delete().eq("id", id);
    if (err) setError(err.message);
    await loadAll();
  }

  async function saveClient(e) {
    e.preventDefault();
    const query = editingClient
      ? supabase.from("clientes").update(clientForm).eq("id", editingClient)
      : supabase.from("clientes").insert(clientForm);
    const { error: err } = await query;
    if (err) return setError(err.message);
    setClientForm(emptyClient);
    setEditingClient(null);
    setModal(null);
    await loadAll();
  }

  async function saveGoal(e) {
    e.preventDefault();
    const { error: err } = await supabase.from("metas").insert({ ...goalForm, valor_alvo: num(goalForm.valor_alvo) });
    if (err) return setError(err.message);
    setGoalForm(emptyGoal);
    setModal(null);
    await loadAll();
  }

  function addSaleItem() {
    const product = productById[saleForm.produto_id];
    const quantity = Math.max(1, Math.floor(num(saleForm.quantidade)));
    if (!product) return;
    setSaleForm((f) => ({
      ...f,
      produto_id: "",
      quantidade: 1,
      itens: [...f.itens, { produto_id: product.id, nome: product.nome, quantidade: quantity, preco_unitario: num(product.preco_final) }],
    }));
  }

  async function registerSale(e) {
    e.preventDefault();
    if (!saleForm.itens.length) return setError("Adicione ao menos um produto à venda.");
    try {
      let clienteId = saleForm.cliente_id || null;
      if (!clienteId && saleForm.nome_cliente.trim()) {
        const created = await supabase
          .from("clientes")
          .insert({ nome: saleForm.nome_cliente.trim(), contato: saleForm.contato })
          .select()
          .single();
        if (created.error) throw created.error;
        clienteId = created.data.id;
      }
      const total = saleForm.itens.reduce((sum, it) => sum + it.quantidade * it.preco_unitario, 0);
      const sale = await supabase
        .from("vendas")
        .insert({ cliente_id: clienteId, contato: saleForm.contato, forma_pagamento: saleForm.forma_pagamento, observacoes: saleForm.observacoes, total })
        .select()
        .single();
      if (sale.error) throw sale.error;
      const rows = saleForm.itens.map((it) => ({ venda_id: sale.data.id, produto_id: it.produto_id, quantidade: it.quantidade, preco_unitario: it.preco_unitario }));
      const insertedItems = await supabase.from("itens_venda").insert(rows);
      if (insertedItems.error) throw insertedItems.error;
      for (const it of saleForm.itens) {
        const current = productById[it.produto_id];
        const nextStock = Math.max(0, num(current.estoque) - it.quantidade);
        const updated = await supabase.from("produtos").update({ estoque: nextStock }).eq("id", it.produto_id);
        if (updated.error) throw updated.error;
      }
      setSaleForm({ cliente_id: "", nome_cliente: "", contato: "", forma_pagamento: "Pix", observacoes: "", produto_id: "", quantidade: 1, itens: [] });
      setModal(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    const payload = {
      id: 1,
      nome_negocio: settings.nome_negocio,
      nome_usuario: settings.nome_usuario,
      taxa_credito: num(settings.taxa_credito),
      taxa_debito: num(settings.taxa_debito),
      taxa_pix: num(settings.taxa_pix),
      taxa_dinheiro: num(settings.taxa_dinheiro),
    };
    const { error: err } = await supabase.from("configuracoes").upsert(payload);
    if (err) return setError(err.message);
    await loadAll();
  }

  async function saveCash(e) {
    e.preventDefault();
    const { error: err } = await supabase.from("lancamentos").insert({ ...cashForm, valor: num(cashForm.valor) });
    if (err) return setError(err.message);
    setCashForm({ tipo: "saída", descricao: "", valor: 0, data: todayISO() });
    await loadAll();
  }

  function periodStart(periodo) {
    const d = new Date();
    if (periodo === "Diário") d.setHours(0, 0, 0, 0);
    if (periodo === "Semanal") d.setDate(d.getDate() - 7);
    if (periodo === "Mensal") d.setMonth(d.getMonth() - 1);
    if (periodo === "Anual") d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  function goalProgress(goal) {
    const start = periodStart(goal.periodo);
    if (goal.tipo === "Faturamento R$") return sales.filter((s) => new Date(s.criado_em) >= start).reduce((sum, s) => sum + num(s.total), 0);
    if (goal.tipo === "Número de vendas") return sales.filter((s) => new Date(s.criado_em) >= start).length;
    return clients.filter((c) => new Date(c.criado_em) >= start).length;
  }

  function chartData() {
    const count = chartMode === "Dia" ? 7 : chartMode === "Semana" ? 8 : 6;
    const map = new Map();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      if (chartMode === "Dia") d.setDate(d.getDate() - i);
      if (chartMode === "Semana") d.setDate(d.getDate() - i * 7);
      if (chartMode === "Mês") d.setMonth(d.getMonth() - i);
      const key = chartMode === "Mês" ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : d.toISOString().slice(0, 10);
      map.set(key, { label: chartMode === "Mês" ? monthKey(d) : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total: 0 });
    }
    for (const sale of sales) {
      const d = new Date(sale.criado_em);
      const key = chartMode === "Mês" ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : d.toISOString().slice(0, 10);
      if (map.has(key)) map.get(key).total += num(sale.total);
    }
    return [...map.values()];
  }

  const paymentTotals = ["Crédito", "Débito", "Pix", "Dinheiro"].map((method) => ({
    method,
    rate: paymentRate(method),
    total: todaySales.filter((s) => s.forma_pagamento === method).reduce((sum, s) => sum + num(s.total), 0),
  }));

  const bestSellers = useMemo(() => {
    const map = new Map();
    for (const it of items) map.set(it.produto_id, (map.get(it.produto_id) || 0) + num(it.quantidade));
    return [...map.entries()].map(([id, qtd]) => ({ nome: productById[id]?.nome || "Produto removido", qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 5);
  }, [items, productById]);

  const filteredProducts = products
    .filter((p) => !stockFilters.category || p.categoria === stockFilters.category)
    .filter((p) => {
      if (stockFilters.status === "Em estoque") return num(p.estoque) > 0;
      if (stockFilters.status === "Sem estoque") return num(p.estoque) === 0;
      if (stockFilters.status === "Estoque baixo") return num(p.estoque) <= 5;
      return true;
    })
    .sort((a, b) => stockFilters.sort === "estoque" ? num(a.estoque) - num(b.estoque) : String(a.nome).localeCompare(String(b.nome)));

  const monthSales = sales.filter((s) => String(s.criado_em).startsWith(period));
  const monthSaleIds = new Set(monthSales.map((s) => s.id));
  const monthItems = items.filter((it) => monthSaleIds.has(it.venda_id));
  const dreRevenue = monthSales.reduce((sum, s) => sum + num(s.total), 0);
  const dreCosts = monthItems.reduce((sum, it) => sum + num(it.quantidade) * num(it.produtos?.custo), 0);
  const dreFees = monthSales.reduce((sum, s) => sum + num(s.total) * paymentRate(s.forma_pagamento) / 100, 0);
  const manualCash = cash.filter((l) => String(l.data).startsWith(period));
  const cashBalance = dreRevenue + manualCash.filter((l) => l.tipo === "entrada").reduce((s, l) => s + num(l.valor), 0) - manualCash.filter((l) => l.tipo === "saída").reduce((s, l) => s + num(l.valor), 0);

  return (
    <>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="profile">
          <div className="avatar">{(settings.nome_usuario || "U").slice(0, 1).toUpperCase()}</div>
          <div><strong>{settings.nome_usuario}</strong><span>PAINEL</span></div>
        </div>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => { setActive(id); setMenuOpen(false); }}>
              <Icon /> {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="app-shell">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
          <div><p className="eyebrow">Empresa Gestor Pro</p><h1>{pageTitle}</h1></div>
          <div className="business-name">{settings.nome_negocio}</div>
        </header>
        {error && <div className="alert">{error}</div>}
        {loading ? <div className="card empty">Carregando dados do Supabase...</div> : (
          <>
            {active === "dashboard" && Dashboard()}
            {active === "pricing" && Pricing()}
            {active === "stock" && Stock()}
            {active === "clients" && Clients()}
            {active === "goals" && Goals()}
            {active === "cash" && Cash()}
            {active === "dre" && Dre()}
            {active === "insights" && Insights()}
            {active === "settings" && SettingsView()}
            {modal === "sale" && SaleModal()}
            {modal === "client" && ClientModal()}
            {modal === "goal" && GoalModal()}
          </>
        )}
      </main>
    </>
  );

  function Dashboard() {
    const bars = chartData();
    const max = Math.max(1, ...bars.map((b) => b.total));
    return (
      <div className="grid">
        <section className="grid metrics">
          <Metric label="Vendas do dia" value={`${todaySales.length} vendas`} sub={fmtMoney(totals.revenue)} />
          <Metric label="Valor em caixa (estoque)" value={fmtMoney(totals.stockValue)} sub={`${products.length} produtos`} />
          <Metric label="Lucro bruto (dia)" value={fmtMoney(totals.gross)} sub="Receita - custo" />
          <Metric danger label="Lucro líquido (dia)" value={fmtMoney(totals.net)} sub={`Taxas: ${fmtMoney(totals.fees)}`} />
        </section>
        <section className="grid main-grid">
          <div className="card">
            <div className="toolbar"><h2>Vendas por período</h2><Segment value={chartMode} setValue={setChartMode} options={["Dia", "Semana", "Mês"]} /></div>
            <div className="chart" style={{ "--bars": bars.length }}>
              {bars.map((b) => <div className="bar-wrap" key={b.label}><div className="bar" data-tip={`${b.label} - ${fmtMoney(b.total)}`} style={{ height: `${Math.max(5, (b.total / max) * 100)}%` }} /><span className="bar-label">{b.label}</span></div>)}
            </div>
          </div>
          <div className="card"><h2>Formas de pagamento (hoje)</h2><div className="list">{paymentTotals.map((p) => <div className="list-row" key={p.method}><div><strong>{p.method}</strong><p className="muted">Taxa: {p.rate}%</p></div><strong>{fmtMoney(p.total)}</strong></div>)}</div></div>
        </section>
        <SalesTable title="Últimas vendas" rows={sales.slice(0, 10)} />
      </div>
    );
  }

  function Metric({ label, value, sub, danger }) {
    return <div className={`card metric-card ${danger ? "danger" : ""}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>;
  }

  function Segment({ value, setValue, options }) {
    return <div className="segmented">{options.map((o) => <button key={o} className={value === o ? "active" : ""} onClick={() => setValue(o)}>{o}</button>)}</div>;
  }

  function Pricing() {
    return (
      <section className="grid two-col">
        <form className="card" onSubmit={saveProduct}>
          <div className="toolbar"><h2>{editingProduct ? "Editar produto" : "Novo produto"}</h2>{editingProduct && <button className="btn" type="button" onClick={() => { setEditingProduct(null); setProductForm(emptyProduct); }}>Cancelar edição</button>}</div>
          <ProductFields />
          <p className="muted">Margem real estimada: <strong>{realMargin().toFixed(1)}%</strong></p>
          <button className="btn primary full" type="submit">{editingProduct ? "Salvar alterações" : "Cadastrar produto"}</button>
        </form>
        <div className="card"><h2>Produtos cadastrados ({products.length})</h2><ProductList /></div>
      </section>
    );
  }

  function ProductFields() {
    return (
      <div className="form-grid">
        <Field label="Nome do Produto"><input value={productForm.nome} placeholder="Ex: Legging Cintura Alta" onChange={(e) => setProductForm({ ...productForm, nome: e.target.value })} required /></Field>
        <Field label="Categoria"><input value={productForm.categoria || ""} placeholder="Fitness, Vestido..." onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })} /></Field>
        <Field label="Foto do Produto" full><input name="foto" type="file" accept="image/*" /></Field>
        {["custo", "custos_variaveis", "frete", "margem_desejada"].map((k) => <Field key={k} label={{ custo: "Custo (R$)", custos_variaveis: "Custos Variáveis (R$)", frete: "Frete (R$)", margem_desejada: "Margem Desejada (%)" }[k]}><input type="number" step="0.01" value={productForm[k]} onChange={(e) => setProductForm({ ...productForm, [k]: e.target.value })} /></Field>)}
        <Field label="Preço Sugerido"><input readOnly value={fmtMoney(productSuggested())} /></Field>
        <Field label="Preço Final"><input type="number" step="0.01" value={productForm.preco_final} onChange={(e) => setProductForm({ ...productForm, preco_final: e.target.value })} /></Field>
        <Field label="Estoque Inicial"><input type="number" value={productForm.estoque} onChange={(e) => setProductForm({ ...productForm, estoque: e.target.value })} /></Field>
        <Field label="Tamanhos / Variações"><input value={productForm.tamanhos || ""} onChange={(e) => setProductForm({ ...productForm, tamanhos: e.target.value })} /></Field>
        <Field label="Descrição / Observações" full><textarea value={productForm.descricao || ""} onChange={(e) => setProductForm({ ...productForm, descricao: e.target.value })} /></Field>
      </div>
    );
  }

  function ProductList() {
    if (!products.length) return <p className="empty">Nenhum produto cadastrado.</p>;
    return <div className="list">{products.map((p) => <div className="list-row" key={p.id}>{p.foto_url && <img className="thumb" src={p.foto_url} alt="" />}<div><strong>{p.nome}</strong><p className="muted">{p.categoria || "Sem categoria"} - {fmtMoney(p.preco_final)} - estoque {p.estoque}</p></div><div className="icon-actions"><IconButton title="Editar" onClick={() => { setEditingProduct(p.id); setProductForm({ ...emptyProduct, ...p }); }}><Pencil /></IconButton><IconButton danger title="Excluir" onClick={() => deleteRow("produtos", p.id)}><Trash2 /></IconButton></div></div>)}</div>;
  }

  function Stock() {
    const categories = [...new Set(products.map((p) => p.categoria).filter(Boolean))];
    return (
      <section className="grid two-col">
        <div className="card">
          <div className="toolbar"><h2>Estoque ({filteredProducts.length})</h2><button className="btn primary" onClick={() => setModal("sale")}><Plus size={17} /> Registrar venda</button></div>
          <div className="filters">
            <select value={stockFilters.category} onChange={(e) => setStockFilters({ ...stockFilters, category: e.target.value })}><option value="">Todas categorias</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={stockFilters.status} onChange={(e) => setStockFilters({ ...stockFilters, status: e.target.value })}><option value="">Todos status</option><option>Em estoque</option><option>Sem estoque</option><option>Estoque baixo</option></select>
            <select value={stockFilters.sort} onChange={(e) => setStockFilters({ ...stockFilters, sort: e.target.value })}><option value="nome">Nome</option><option value="estoque">Estoque</option></select>
          </div>
          <ProductsTable rows={filteredProducts} />
        </div>
        <div className="grid"><BestSellers /><RecentSales small /></div>
      </section>
    );
  }

  function ProductsTable({ rows }) {
    return <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th></tr></thead><tbody>{rows.map((p) => <tr key={p.id}><td>{p.nome}</td><td>{p.categoria}</td><td>{fmtMoney(p.preco_final)}</td><td>{p.estoque}</td><td><span className="status-pill">{num(p.estoque) === 0 ? "Sem estoque" : num(p.estoque) <= 5 ? "Estoque baixo" : "Em estoque"}</span></td></tr>)}</tbody></table></div>;
  }

  function SaleModal() {
    const total = saleForm.itens.reduce((s, it) => s + it.quantidade * it.preco_unitario, 0);
    return (
      <Modal title="Nova venda" onClose={() => setModal(null)}>
        <form onSubmit={registerSale} className="grid">
          <div className="form-grid">
            <Field label="Cliente"><input list="clientes" value={saleForm.nome_cliente} onChange={(e) => { const c = clients.find((x) => x.nome === e.target.value); setSaleForm({ ...saleForm, nome_cliente: e.target.value, cliente_id: c?.id || "", contato: c?.contato || saleForm.contato }); }} /><datalist id="clientes">{clients.map((c) => <option key={c.id} value={c.nome} />)}</datalist></Field>
            <Field label="Contato"><input value={saleForm.contato} onChange={(e) => setSaleForm({ ...saleForm, contato: e.target.value })} /></Field>
            <Field label="Produto"><select value={saleForm.produto_id} onChange={(e) => setSaleForm({ ...saleForm, produto_id: e.target.value })}><option value="">Selecione</option>{products.filter((p) => num(p.estoque) > 0).map((p) => <option value={p.id} key={p.id}>{p.nome} - {fmtMoney(p.preco_final)}</option>)}</select></Field>
            <Field label="Quantidade"><div className="sale-product-row"><input type="number" min="1" value={saleForm.quantidade} onChange={(e) => setSaleForm({ ...saleForm, quantidade: e.target.value })} /><button className="btn" type="button" onClick={addSaleItem}><Plus size={16} /></button></div></Field>
            <Field label="Forma de pagamento"><select value={saleForm.forma_pagamento} onChange={(e) => setSaleForm({ ...saleForm, forma_pagamento: e.target.value })}>{["Pix", "Crédito", "Débito", "Dinheiro"].map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Observações" full><textarea value={saleForm.observacoes} onChange={(e) => setSaleForm({ ...saleForm, observacoes: e.target.value })} /></Field>
          </div>
          <div className="list">{saleForm.itens.map((it, idx) => <div className="list-row" key={idx}><span>{it.nome} x {it.quantidade}</span><strong>{fmtMoney(it.quantidade * it.preco_unitario)}</strong></div>)}</div>
          <h2>Total: {fmtMoney(total)}</h2>
          <button className="btn primary full" type="submit">Registrar venda</button>
        </form>
      </Modal>
    );
  }

  function Clients() {
    const filtered = clients.filter((c) => `${c.nome} ${c.contato}`.toLowerCase().includes(clientSearch.toLowerCase()));
    return <div className="card"><div className="toolbar"><h2>{filtered.length} clientes</h2><div className="filters"><input placeholder="Buscar nome ou contato" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} /><button className="btn primary" onClick={() => { setClientForm(emptyClient); setEditingClient(null); setModal("client"); }}>Novo</button></div></div><div className="list">{filtered.map((c) => <div className="list-row" key={c.id}><div><strong>{c.nome}</strong><p className="muted">{c.contato} {c.email && `- ${c.email}`}</p></div><div className="icon-actions"><IconButton title="Editar" onClick={() => { setClientForm(c); setEditingClient(c.id); setModal("client"); }}><Pencil /></IconButton><IconButton danger title="Excluir" onClick={() => deleteRow("clientes", c.id)}><Trash2 /></IconButton></div></div>)}</div></div>;
  }

  function ClientModal() {
    return <Modal title={editingClient ? "Editar cliente" : "Novo cliente"} onClose={() => setModal(null)}><form className="grid" onSubmit={saveClient}><div className="form-grid">{["nome", "contato", "email"].map((k) => <Field key={k} label={{ nome: "Nome", contato: "Contato (WhatsApp/telefone)", email: "Email" }[k]}><input value={clientForm[k] || ""} onChange={(e) => setClientForm({ ...clientForm, [k]: e.target.value })} required={k === "nome"} /></Field>)}<Field label="Preferências" full><textarea value={clientForm.preferencias || ""} onChange={(e) => setClientForm({ ...clientForm, preferencias: e.target.value })} /></Field><Field label="Observações" full><textarea value={clientForm.observacoes || ""} onChange={(e) => setClientForm({ ...clientForm, observacoes: e.target.value })} /></Field></div><button className="btn primary full">{editingClient ? "Salvar cliente" : "Cadastrar"}</button></form></Modal>;
  }

  function Goals() {
    return <div className="card"><div className="toolbar"><h2>Metas</h2><button className="btn primary" onClick={() => setModal("goal")}><Plus size={17} /> Nova meta</button></div><div className="list">{goals.map((g) => { const done = goalProgress(g); const pct = Math.min(100, (done / Math.max(1, num(g.valor_alvo))) * 100); return <div className="list-row" key={g.id}><div className="grow"><strong>{g.tipo} - {g.periodo}</strong><p className="muted">{g.descricao || "Sem descrição"} - {fmtMoney(done)} de {fmtMoney(g.valor_alvo)}</p><div className="progress"><span style={{ "--progress": `${pct}%` }} /></div></div><IconButton danger title="Excluir" onClick={() => deleteRow("metas", g.id)}><Trash2 /></IconButton></div>; })}</div></div>;
  }

  function GoalModal() {
    return <Modal title="Nova meta" onClose={() => setModal(null)}><form className="grid" onSubmit={saveGoal}><div className="form-grid"><Field label="Tipo"><select value={goalForm.tipo} onChange={(e) => setGoalForm({ ...goalForm, tipo: e.target.value })}>{["Faturamento R$", "Número de vendas", "Novos clientes"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Período"><select value={goalForm.periodo} onChange={(e) => setGoalForm({ ...goalForm, periodo: e.target.value })}>{["Diário", "Semanal", "Mensal", "Anual"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Valor-alvo"><input type="number" step="0.01" value={goalForm.valor_alvo} onChange={(e) => setGoalForm({ ...goalForm, valor_alvo: e.target.value })} /></Field><Field label="Descrição" full><textarea value={goalForm.descricao} onChange={(e) => setGoalForm({ ...goalForm, descricao: e.target.value })} /></Field></div><button className="btn primary full">Criar meta</button></form></Modal>;
  }

  function Cash() {
    return <section className="grid two-col"><div className="card"><div className="toolbar"><h2>Fluxo de Caixa</h2><input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></div><h2>Saldo total: {fmtMoney(cashBalance)}</h2><div className="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>{[...monthSales.map((s) => ({ data: s.criado_em, descricao: `Venda ${s.id.slice(0, 8)}`, tipo: "entrada", valor: s.total })), ...manualCash].map((l, idx) => <tr key={idx}><td>{dateBR(l.data || l.criado_em)}</td><td>{l.descricao}</td><td>{l.tipo}</td><td>{fmtMoney(l.valor)}</td></tr>)}</tbody></table></div></div><form className="card grid" onSubmit={saveCash}><h2>Novo lançamento</h2><Field label="Tipo"><select value={cashForm.tipo} onChange={(e) => setCashForm({ ...cashForm, tipo: e.target.value })}><option>entrada</option><option>saída</option></select></Field><Field label="Descrição"><input value={cashForm.descricao} onChange={(e) => setCashForm({ ...cashForm, descricao: e.target.value })} required /></Field><Field label="Valor"><input type="number" step="0.01" value={cashForm.valor} onChange={(e) => setCashForm({ ...cashForm, valor: e.target.value })} /></Field><Field label="Data"><input type="date" value={cashForm.data} onChange={(e) => setCashForm({ ...cashForm, data: e.target.value })} /></Field><button className="btn primary">Adicionar</button></form></section>;
  }

  function Dre() {
    return <div className="card"><div className="toolbar"><h2>Demonstrativo de Resultado</h2><input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></div><div className="list">{[["Receita Bruta", dreRevenue], ["Descontos", 0], ["Receita Líquida", dreRevenue], ["Custos", dreCosts], ["Lucro Bruto", dreRevenue - dreCosts], ["Despesas / Taxas", dreFees], ["Lucro Líquido", dreRevenue - dreCosts - dreFees]].map(([label, value]) => <div className="list-row" key={label}><span>{label}</span><strong>{fmtMoney(value)}</strong></div>)}</div></div>;
  }

  function Insights() {
    const monthly = new Map();
    for (const s of sales) monthly.set(monthKey(s.criado_em), (monthly.get(monthKey(s.criado_em)) || 0) + num(s.total));
    const maxMonthly = Math.max(1, ...[...monthly.values()]);
    return <div className="grid main-grid">{BestSellers()}<div className="card"><h2>Faturamento por mês</h2><div className="chart" style={{ "--bars": monthly.size || 1 }}>{[...monthly.entries()].map(([label, total]) => <div className="bar-wrap" key={label}><div className="bar" data-tip={`${label} - ${fmtMoney(total)}`} style={{ height: `${Math.max(5, total / maxMonthly * 100)}%` }} /><span className="bar-label">{label}</span></div>)}</div><p className="muted">Ticket médio: {fmtMoney(sales.reduce((s, x) => s + num(x.total), 0) / Math.max(1, sales.length))}</p></div><div className="card"><h2>Vendas por forma de pagamento</h2><div className="list">{["Pix", "Crédito", "Débito", "Dinheiro"].map((p) => <div className="list-row" key={p}><span>{p}</span><strong>{sales.filter((s) => s.forma_pagamento === p).length}</strong></div>)}</div></div></div>;
  }

  function SettingsView() {
    return <form className="card grid" onSubmit={saveSettings}><h2>Configurações</h2><div className="form-grid"><Field label="Nome do negócio"><input value={settings.nome_negocio || ""} onChange={(e) => setSettings({ ...settings, nome_negocio: e.target.value })} /></Field><Field label="Nome do usuário"><input value={settings.nome_usuario || ""} onChange={(e) => setSettings({ ...settings, nome_usuario: e.target.value })} /></Field>{[["taxa_credito", "Taxa Crédito (%)"], ["taxa_debito", "Taxa Débito (%)"], ["taxa_pix", "Taxa Pix (%)"], ["taxa_dinheiro", "Taxa Dinheiro (%)"]].map(([k, label]) => <Field key={k} label={label}><input type="number" step="0.01" value={settings[k] || 0} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} /></Field>)}</div><button className="btn primary full">Salvar configurações</button></form>;
  }

  function SalesTable({ title, rows }) {
    return <div className="card"><h2>{title}</h2><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Produto</th><th>Valor</th><th>Pagamento</th><th>Data</th></tr></thead><tbody>{rows.map((s) => <tr key={s.id}><td>{s.clientes?.nome || clientById[s.cliente_id]?.nome || "Cliente avulso"}</td><td>{(s.itens_venda || []).map((it) => it.produtos?.nome).filter(Boolean).join(", ") || "-"}</td><td>{fmtMoney(s.total)}</td><td>{s.forma_pagamento}</td><td>{dateBR(s.criado_em)}</td></tr>)}</tbody></table></div></div>;
  }

  function RecentSales() {
    return <SalesTable title="Últimas vendas" rows={sales.slice(0, 5)} />;
  }

  function BestSellers() {
    return <div className="card"><h2>Mais vendidos</h2><div className="list">{bestSellers.length ? bestSellers.map((p) => <div className="list-row" key={p.nome}><span>{p.nome}</span><strong>{p.qtd}</strong></div>) : <p className="empty">Sem vendas registradas.</p>}</div></div>;
  }
}
