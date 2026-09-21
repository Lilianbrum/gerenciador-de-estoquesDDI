import { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  productClasses, units, initialProducts, initialMovements, initialUsers,
  type Product, type Movement, type User, type ProductClass, type Unit, type Sector
} from './data';

type View = 'dashboard' | 'produtos' | 'classes' | 'movimentacoes' | 'unidades' | 'usuarios';

const roleLabel: Record<string, string> = { admin: 'Administrador', gestor: 'Gestor', operador: 'Operador' };
const roleColor: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', gestor: 'bg-blue-100 text-blue-700', operador: 'bg-slate-100 text-slate-600' };
const movTypeLabel: Record<string, string> = { entrada: 'Entrada', saida: 'Saída', transferencia: 'Transferência' };
const movTypeColor: Record<string, string> = { entrada: 'bg-green-100 text-green-700', saida: 'bg-red-100 text-red-700', transferencia: 'bg-blue-100 text-blue-700' };

type DashboardData = {
  classes: number;
  produtos: number;
  unidades: number;
  setores: number;
  estoque_total: number;
  distribuicao_por_unidade: Array<{
    id: number;
    nome: string;
    localizacao: string;
    quantidade: number;
  }>;
};

const NAV_ITEMS: { key: View; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'produtos', label: 'Produtos', icon: '⊞' },
  { key: 'classes', label: 'Classes', icon: '◈' },
  { key: 'movimentacoes', label: 'Movimentações', icon: '⇄' },
  { key: 'unidades', label: 'Unidades e Setores', icon: '⊕' },
  { key: 'usuarios', label: 'Usuários', icon: '◯' },
];

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className="p-5">
      <div className={`w-2 h-8 rounded-sm mb-4`} style={{ background: color }} />
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </Card>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</span>
      <input
        className="border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        {...props}
      />
    </label>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</span>
      <select
        className="border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</span>
      <textarea
        className="border border-slate-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
        rows={3}
        {...props}
      />
    </label>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({
  products,
  movements,
  dashboardData,
}: {
  products: Product[];
  movements: Movement[];
  dashboardData: DashboardData;
}) {
  const totalItems = dashboardData.produtos;
  const criticalItems = products.filter(p => p.active && p.currentStock <= p.minStock).length;
  const totalStock = dashboardData.estoque_total;
  const monthMov = movements.filter(m => m.date.startsWith('2026-09')).length;

  const stockByClass = productClasses.map(c => ({
    name: c.name.split(' ')[0] + (c.name.split(' ')[1] ? ' ' + c.name.split(' ')[1] : ''),
    qty: products.filter(p => p.classId === c.id && p.active).reduce((s, p) => s + p.currentStock, 0),
    color: c.color,
  }));

  const movByDay = (() => {
    const days: Record<string, { entrada: number; saida: number }> = {};
    movements.filter(m => m.date.startsWith('2026-09')).forEach(m => {
      const d = m.date.slice(8);
      if (!days[d]) days[d] = { entrada: 0, saida: 0 };
      if (m.type === 'entrada') days[d].entrada += m.quantity;
      if (m.type === 'saida') days[d].saida += m.quantity;
    });
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([d, v]) => ({ dia: `${d}/09`, ...v }));
  })();

  const pieData = productClasses.map(c => ({
    name: c.name.split(' ')[0],
    value: products.filter(p => p.classId === c.id && p.active).length,
    color: c.color,
  })).filter(d => d.value > 0);

  const critical = products.filter(p => p.active && p.currentStock <= p.minStock).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Setembro 2026 — Visão geral do estoque</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Produtos Ativos" value={totalItems} sub="cadastros ativos" color="#2563eb" />
        <StatCard label="Estoque Total" value={totalStock.toLocaleString()} sub="unidades em estoque" color="#16a34a" />
        <StatCard label="Itens Críticos" value={criticalItems} sub="abaixo do mínimo" color="#dc2626" />
        <StatCard label="Movimentações" value={monthMov} sub="no mês atual" color="#d97706" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Movimentações — Setembro 2026</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={movByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="entrada" stroke="#16a34a" strokeWidth={2} dot={false} name="Entrada" />
              <Line type="monotone" dataKey="saida" stroke="#dc2626" strokeWidth={2} dot={false} name="Saída" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Produtos por Classe</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                </span>
                <span className="font-mono font-medium text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Estoque por Classe</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stockByClass} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Bar dataKey="qty" radius={[0, 4, 4, 0]} name="Qtd.">
                {stockByClass.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Distribuição por unidade</p>
          {dashboardData.distribuicao_por_unidade.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhum estoque cadastrado</p>
          ) : (
            <div className="space-y-2">
              {dashboardData.distribuicao_por_unidade.map(unidade => (
                <div key={unidade.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{unidade.nome}</p>
                    {unidade.localizacao && (
                      <p className="text-xs text-slate-400 truncate">{unidade.localizacao}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-bold text-slate-800">{unidade.quantidade.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Produtos ────────────────────────────────────────────────────────────────
function Produtos({ products, setProducts }: { products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'del'>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || p.classId === Number(filterClass);
    const matchStatus = filterStatus === '' ? true : filterStatus === '1' ? p.active : !p.active;
    return matchSearch && matchClass && matchStatus;
  }), [products, search, filterClass, filterStatus]);

  function openAdd() {
    setForm({ active: true, currentStock: 0, minStock: 0, classId: 1 });
    setModal('add');
  }

  function openEdit(p: Product) {
    setSelected(p); setForm({ ...p }); setModal('edit');
  }

  function openDel(p: Product) {
    setSelected(p); setModal('del');
  }

  function saveProduct() {
    if (modal === 'add') {
      const nextId = Math.max(...products.map(p => p.id)) + 1;
      setProducts(prev => [...prev, { ...form, id: nextId, createdAt: new Date().toISOString().slice(0, 10) } as Product]);
    } else if (modal === 'edit' && selected) {
      setProducts(prev => prev.map(p => p.id === selected.id ? { ...p, ...form } as Product : p));
    }
    setModal(null);
  }

  function toggleActive(p: Product) {
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
  }

  const stockStatus = (p: Product) => {
    if (p.currentStock === 0) return <Badge className="bg-red-100 text-red-700">Esgotado</Badge>;
    if (p.currentStock <= p.minStock) return <Badge className="bg-orange-100 text-orange-700">Crítico</Badge>;
    return <Badge className="bg-green-100 text-green-700">Normal</Badge>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Produtos</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors">
          + Novo Produto
        </button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="Buscar" placeholder="Nome ou código..." value={search} onChange={e => setSearch(e.target.value)} />
          <Select label="Classe" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">Todas as classes</option>
            {productClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="1">Ativos</option>
            <option value="0">Inativos</option>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Classe</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unidade</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estoque</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mínimo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const cls = productClasses.find(c => c.id === p.classId);
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ background: cls?.color }} />
                        {cls?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.unit}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{p.currentStock}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{p.minStock}</td>
                    <td className="px-4 py-3">{stockStatus(p)}</td>
                    <td className="px-4 py-3">
                      <Badge className={p.active ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">Editar</button>
                        <button onClick={() => toggleActive(p)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded transition-colors">{p.active ? 'Desativar' : 'Ativar'}</button>
                        <button onClick={() => openDel(p)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-sm">Nenhum produto encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Novo Produto' : 'Editar Produto'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Código" value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ME-001" />
            <Select label="Classe" value={form.classId || ''} onChange={e => setForm(f => ({ ...f, classId: Number(e.target.value) }))}>
              {productClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <Input label="Nome" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do produto" />
          <Textarea label="Descrição" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição detalhada..." />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Unidade de Medida" value={form.unit || ''} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="Resma" />
            <Input label="Estoque Atual" type="number" value={form.currentStock ?? 0} onChange={e => setForm(f => ({ ...f, currentStock: Number(e.target.value) }))} />
            <Input label="Estoque Mínimo" type="number" value={form.minStock ?? 0} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active ?? true} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
            <label htmlFor="active" className="text-sm text-slate-700">Produto ativo</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={saveProduct} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Salvar</button>
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'del'} onClose={() => setModal(null)} title="Excluir Produto">
        <p className="text-sm text-slate-600 mb-2">Confirma exclusão de <strong>{selected?.name}</strong>?</p>
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded mb-4">Esta ação não pode ser desfeita. O produto será removido permanentemente.</p>
        <div className="flex gap-3">
          <button onClick={() => { setProducts(prev => prev.filter(p => p.id !== selected?.id)); setModal(null); }}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
            Confirmar Exclusão
          </button>
          <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Classes ─────────────────────────────────────────────────────────────────
function Classes({ products }: { products: Product[] }) {
  const [classes, setClasses] = useState<ProductClass[]>(productClasses);
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'del'>(null);
  const [selected, setSelected] = useState<ProductClass | null>(null);
  const [form, setForm] = useState<Partial<ProductClass>>({});

  function openAdd() { setForm({ color: '#2563eb' }); setModal('add'); }
  function openEdit(c: ProductClass) { setSelected(c); setForm({ ...c }); setModal('edit'); }

  function save() {
    if (modal === 'add') {
      const nextId = Math.max(...classes.map(c => c.id)) + 1;
      setClasses(prev => [...prev, { ...form, id: nextId } as ProductClass]);
    } else if (selected) {
      setClasses(prev => prev.map(c => c.id === selected.id ? { ...c, ...form } as ProductClass : c));
    }
    setModal(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Classes de Produtos</h2>
          <p className="text-sm text-slate-500 mt-0.5">{classes.length} classes cadastradas</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Nova Classe
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(c => {
          const count = products.filter(p => p.classId === c.id && p.active).length;
          const stockTotal = products.filter(p => p.classId === c.id && p.active).reduce((s, p) => s + p.currentStock, 0);
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ background: c.color }}>
                  {c.name[0]}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">Editar</button>
                  <button onClick={() => { setSelected(c); setModal('del'); }} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors">Excluir</button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">{c.description}</p>
              <div className="flex justify-between text-xs border-t border-slate-100 pt-3 mt-auto">
                <div>
                  <p className="text-slate-400">Produtos</p>
                  <p className="font-mono font-bold text-slate-800">{count}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Em estoque</p>
                  <p className="font-mono font-bold text-slate-800">{stockTotal.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Nova Classe' : 'Editar Classe'}>
        <div className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input label="Nome da Classe" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Material de Escritório" />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Cor</span>
              <input type="color" value={form.color || '#2563eb'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="h-10 w-14 rounded border border-slate-200 cursor-pointer p-0.5" />
            </label>
          </div>
          <Textarea label="Descrição" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição da classe..." />
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Salvar</button>
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'del'} onClose={() => setModal(null)} title="Excluir Classe">
        <p className="text-sm text-slate-600 mb-4">Confirma exclusão da classe <strong>{selected?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => { setClasses(prev => prev.filter(c => c.id !== selected?.id)); setModal(null); }}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
            Confirmar
          </button>
          <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Movimentações ────────────────────────────────────────────────────────────
function Movimentacoes({ products, movements, setMovements, users }: {
  products: Product[]; movements: Movement[]; setMovements: React.Dispatch<React.SetStateAction<Movement[]>>; users: User[];
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<Movement & { productId: number; type: Movement['type'] }>>({
    type: 'entrada', productId: products[0]?.id, quantity: 1, unitId: units[0]?.id, sectorId: units[0]?.sectors[0]?.id, responsible: '', notes: ''
  });

  const filtered = useMemo(() => movements.filter(m => {
    const p = products.find(x => x.id === m.productId);
    const matchSearch = !search || p?.name.toLowerCase().includes(search.toLowerCase()) || p?.code.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || m.type === filterType;
    return matchSearch && matchType;
  }).sort((a, b) => b.date.localeCompare(a.date)), [movements, search, filterType, products]);

  function save() {
    const nextId = Math.max(0, ...movements.map(m => m.id)) + 1;
    const newMov: Movement = {
      id: nextId,
      type: form.type as Movement['type'],
      productId: Number(form.productId),
      quantity: Number(form.quantity),
      unitId: form.type !== 'transferencia' ? Number(form.unitId) : undefined,
      sectorId: form.type !== 'transferencia' ? Number(form.sectorId) : undefined,
      fromUnitId: form.type === 'transferencia' ? Number(form.fromUnitId || units[0].id) : undefined,
      toUnitId: form.type === 'transferencia' ? Number(form.toUnitId || units[1]?.id) : undefined,
      responsible: form.responsible || '',
      notes: form.notes || '',
      date: new Date().toISOString().slice(0, 10),
      userId: 1,
    };

    setMovements(prev => [newMov, ...prev]);

    // Update product stock
    const qty = Number(form.quantity);
    if (form.type === 'entrada') {
      products.find(p => p.id === Number(form.productId) && (p.currentStock += qty));
    } else if (form.type === 'saida') {
      products.find(p => p.id === Number(form.productId) && (p.currentStock -= qty));
    }

    setModal(false);
  }

  const selectedUnit = units.find(u => u.id === Number(form.unitId));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Movimentações</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Registrar Movimentação
        </button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Buscar produto" placeholder="Nome ou código..." value={search} onChange={e => setSearch(e.target.value)} />
          <Select label="Tipo" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="transferencia">Transferência</option>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qtd.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Destino / Origem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Observações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const p = products.find(x => x.id === m.productId);
                const unit = m.unitId ? units.find(u => u.id === m.unitId) : null;
                const sector = unit?.sectors.find(s => s.id === m.sectorId);
                const fromUnit = m.fromUnitId ? units.find(u => u.id === m.fromUnitId) : null;
                const toUnit = m.toUnitId ? units.find(u => u.id === m.toUnitId) : null;
                return (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{m.date}</td>
                    <td className="px-4 py-3"><Badge className={movTypeColor[m.type]}>{movTypeLabel[m.type]}</Badge></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p?.name || '—'}</p>
                      <p className="text-xs text-slate-400 font-mono">{p?.code}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{m.quantity}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {m.type === 'transferencia'
                        ? <>{fromUnit?.code} → {toUnit?.code}</>
                        : <>{unit?.name}{sector ? ` / ${sector.name}` : ''}</>
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.responsible}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{m.notes}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Nenhuma movimentação encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Movimentação">
        <div className="space-y-4">
          <Select label="Tipo de Movimentação" value={form.type || 'entrada'} onChange={e => setForm(f => ({ ...f, type: e.target.value as Movement['type'] }))}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="transferencia">Transferência</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Produto" value={form.productId || ''} onChange={e => setForm(f => ({ ...f, productId: Number(e.target.value) }))}>
              {products.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </Select>
            <Input label="Quantidade" type="number" min={1} value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
          </div>
          {form.type !== 'transferencia' ? (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Unidade" value={form.unitId || ''} onChange={e => setForm(f => ({ ...f, unitId: Number(e.target.value), sectorId: undefined }))}>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
              <Select label="Setor" value={form.sectorId || ''} onChange={e => setForm(f => ({ ...f, sectorId: Number(e.target.value) }))}>
                {selectedUnit?.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Unidade de Origem" value={form.fromUnitId || ''} onChange={e => setForm(f => ({ ...f, fromUnitId: Number(e.target.value) }))}>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
              <Select label="Unidade de Destino" value={form.toUnitId || ''} onChange={e => setForm(f => ({ ...f, toUnitId: Number(e.target.value) }))}>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </div>
          )}
          <Input label="Responsável" value={form.responsible || ''} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Nome do responsável" />
          <Textarea label="Observações / NF" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Número de nota fiscal, observações..." />
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Registrar</button>
            <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Unidades ─────────────────────────────────────────────────────────────────
function Unidades({ products }: { products: Product[] }) {
  const [unitsList, setUnitsList] = useState<Unit[]>(units);
  const [modal, setModal] = useState<null | 'add-unit' | 'add-sector' | 'del-unit'>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState<{ name: string; code: string }>({ name: '', code: '' });
  const [sectorForm, setSectorForm] = useState({ name: '' });

  function addUnit() {
    if (!form.name.trim() || !form.code.trim()) return;

    const nextId = Math.max(0, ...unitsList.map(u => u.id)) + 1;

    setUnitsList(prev => [
      ...prev,
      {
        id: nextId,
        name: form.name.trim(),
        code: form.code.trim(),
        sectors: [],
      },
    ]);

    setModal(null);
    setForm({ name: '', code: '' });
  }

  function addSector() {
    if (!selectedUnit || !sectorForm.name.trim()) return;

    const allSectors = unitsList.flatMap(u => u.sectors);
    const nextId = Math.max(0, ...allSectors.map(s => s.id)) + 1;

    setUnitsList(prev =>
      prev.map(u =>
        u.id === selectedUnit.id
          ? {
              ...u,
              sectors: [
                ...u.sectors,
                {
                  id: nextId,
                  unitId: u.id,
                  name: sectorForm.name.trim(),
                },
              ],
            }
          : u
      )
    );

    setModal(null);
    setSectorForm({ name: '' });
  }

  function openDeleteUnit(unit: Unit) {
    setSelectedUnit(unit);
    setModal('del-unit');
  }

  function deleteUnit() {
    if (!selectedUnit) return;

    setUnitsList(prev => prev.filter(u => u.id !== selectedUnit.id));

    setSelectedUnit(null);
    setModal(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Unidades e Setores
          </h2>

          <p className="text-sm text-slate-500 mt-0.5">
            {unitsList.length} unidade{unitsList.length !== 1 ? 's' : ''} •{' '}
            {unitsList.flatMap(u => u.sectors).length} setor
            {unitsList.flatMap(u => u.sectors).length !== 1 ? 'es' : ''}
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ name: '', code: '' });
            setModal('add-unit');
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Unidade
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {unitsList.map(unit => {
          return (
            <Card key={unit.id} className="overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {unit.code}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {unit.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {unit.sectors.length} setor
                      {unit.sectors.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedUnit(unit);
                      setSectorForm({ name: '' });
                      setModal('add-sector');
                    }}
                    className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                  >
                    + Setor
                  </button>

                  <button
                    onClick={() => openDeleteUnit(unit)}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {unit.sectors.map(s => (
                  <div
                    key={s.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-sm text-slate-700">
                      {s.name}
                    </span>

                    <button
                      onClick={() =>
                        setUnitsList(prev =>
                          prev.map(u =>
                            u.id === unit.id
                              ? {
                                  ...u,
                                  sectors: u.sectors.filter(
                                    x => x.id !== s.id
                                  ),
                                }
                              : u
                          )
                        )
                      }
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ))}

                {unit.sectors.length === 0 && (
                  <p className="px-5 py-4 text-xs text-slate-400 text-center">
                    Nenhum setor cadastrado
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={modal === 'add-unit'}
        onClose={() => setModal(null)}
        title="Nova Unidade"
      >
        <div className="space-y-4">
          <Input
            label="Nome da Unidade"
            value={form.name}
            onChange={e =>
              setForm(f => ({
                ...f,
                name: e.target.value,
              }))
            }
            placeholder="Unidade Norte"
          />

          <Input
            label="Código"
            value={form.code}
            onChange={e =>
              setForm(f => ({
                ...f,
                code: e.target.value,
              }))
            }
            placeholder="UN-N"
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={addUnit}
              disabled={!form.name.trim() || !form.code.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar
            </button>

            <button
              onClick={() => setModal(null)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'add-sector'}
        onClose={() => setModal(null)}
        title={`Novo Setor — ${selectedUnit?.name || ''}`}
      >
        <div className="space-y-4">
          <Input
            label="Nome do Setor"
            value={sectorForm.name}
            onChange={e =>
              setSectorForm({
                name: e.target.value,
              })
            }
            placeholder="Almoxarifado"
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={addSector}
              disabled={!sectorForm.name.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar
            </button>

            <button
              onClick={() => setModal(null)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === 'del-unit'}
        onClose={() => setModal(null)}
        title="Excluir Unidade"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Confirma a exclusão da unidade{' '}
            <strong>{selectedUnit?.name}</strong>?
          </p>

          {selectedUnit && selectedUnit.sectors.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <p className="text-xs text-orange-700">
                Esta unidade possui {selectedUnit.sectors.length} setor
                {selectedUnit.sectors.length !== 1 ? 'es' : ''}.
                A exclusão também removerá esses setores da lista.
              </p>
            </div>
          )}

          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
            Esta ação remove a unidade da lista atual.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={deleteUnit}
              className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirmar Exclusão
            </button>

            <button
              onClick={() => setModal(null)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
function Usuarios() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'del'>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({});

  function openAdd() { setForm({ role: 'operador', active: true }); setModal('add'); }
  function openEdit(u: User) { setSelected(u); setForm({ ...u }); setModal('edit'); }

  function save() {
    if (modal === 'add') {
      const nextId = Math.max(...users.map(u => u.id)) + 1;
      setUsers(prev => [...prev, { ...form, id: nextId, createdAt: new Date().toISOString().slice(0, 10) } as User]);
    } else if (selected) {
      setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, ...form } as User : u));
    }
    setModal(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Usuários</h2>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} usuários cadastrados</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Novo Usuário
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">E-mail</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Perfil</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cadastro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const unit = units.find(x => x.id === u.unitId);
                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold uppercase">
                          {u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{u.email}</td>
                    <td className="px-4 py-3"><Badge className={roleColor[u.role]}>{roleLabel[u.role]}</Badge></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{unit?.name || 'Todas'}</td>
                    <td className="px-4 py-3">
                      <Badge className={u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{u.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(u)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">Editar</button>
                        <button onClick={() => { setSelected(u); setModal('del'); }} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Novo Usuário' : 'Editar Usuário'}>
        <div className="space-y-4">
          <Input label="Nome Completo" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Carlos Andrade" />
          <Input label="E-mail" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@empresa.gov.br" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Perfil" value={form.role || 'operador'} onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}>
              <option value="admin">Administrador</option>
              <option value="gestor">Gestor</option>
              <option value="operador">Operador</option>
            </Select>
            <Select label="Unidade" value={form.unitId || ''} onChange={e => setForm(f => ({ ...f, unitId: e.target.value ? Number(e.target.value) : undefined }))}>
              <option value="">Todas</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="userActive" checked={form.active ?? true} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
            <label htmlFor="userActive" className="text-sm text-slate-700">Usuário ativo</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Salvar</button>
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'del'} onClose={() => setModal(null)} title="Excluir Usuário">
        <p className="text-sm text-slate-600 mb-4">Confirma exclusão de <strong>{selected?.name}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={() => { setUsers(prev => prev.filter(u => u.id !== selected?.id)); setModal(null); }}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
            Confirmar
          </button>
          <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [products, setProducts] = useState(initialProducts);
  const [movements, setMovements] = useState(initialMovements);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    classes: 0,
    produtos: 0,
    unidades: 0,
    setores: 0,
    estoque_total: 0,
    distribuicao_por_unidade: [],
  });

  useEffect(() => {
    fetch('/core/api/dashboard/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao carregar o Dashboard.');
        }
        return response.json();
      })
      .then(data => {
        setDashboardData(data);
      })
      .catch(error => {
        console.error('Erro ao carregar dados do Dashboard:', error);
      });
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} bg-slate-900 flex flex-col shrink-0 transition-all duration-200`}>
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">GE</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white text-xs font-bold truncate">Gestor de Estoque</p>
              <p className="text-slate-500 text-xs truncate">v1.0 — Administrativo</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm transition-colors ${
                view === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="px-2 pb-4">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors text-xs"
          >
            <span className="text-base shrink-0">{sidebarOpen ? '◁' : '▷'}</span>
            {sidebarOpen && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Início</span>
            <span>/</span>
            <span className="text-slate-700 font-medium capitalize">{NAV_ITEMS.find(n => n.key === view)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            {products.filter(p => p.active && p.currentStock <= p.minStock).length > 0 && (
              <button onClick={() => setView('produtos')} className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                {products.filter(p => p.active && p.currentStock <= p.minStock).length} itens críticos
              </button>
            )}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</div>
              <span className="text-sm font-medium text-slate-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' && <Dashboard products={products} movements={movements} dashboardData={dashboardData} />}
          {view === 'produtos' && <Produtos products={products} setProducts={setProducts} />}
          {view === 'classes' && <Classes products={products} />}
          {view === 'movimentacoes' && <Movimentacoes products={products} movements={movements} setMovements={setMovements} users={initialUsers} />}
          {view === 'unidades' && <Unidades products={products} />}
          {view === 'usuarios' && <Usuarios />}
        </main>
      </div>
    </div>
  );
}
