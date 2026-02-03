import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Upload, 
  Camera, 
  Printer, 
  FileText,
  X, 
  ExternalLink,
  CreditCard,
  Cloud,
  RefreshCw,
  Settings,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Expense, Category, CloudSettings } from './types';
import { CATEGORIES, MONTHS, STORAGE_KEY } from './constants';
import { generateId, formatCurrency, toBase64, saveToGithub, loadFromGithub, exportToCSV } from './utils';
import Calendar from './components/Calendar';
import CategorySummary from './components/CategorySummary';

const CLOUD_STORAGE_KEY = 'finance_pro_cloud_settings';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [cloudSettings, setCloudSettings] = useState<CloudSettings>({
    githubToken: '',
    gistId: '',
    lastSync: undefined
  });

  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    date: '',
    category: 'Outros',
    amount: 0,
    description: '',
    driveLink: '',
    receiptImage: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedCloud = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (savedCloud) setCloudSettings(JSON.parse(savedCloud));
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error("Erro LocalStorage", e);
      }
    }
  };

  useEffect(() => {
    if (!isReadOnly) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, isReadOnly]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expenses, selectedMonth, selectedYear]);

  const handleCloudSave = async () => {
    if (!cloudSettings.githubToken || !cloudSettings.gistId) {
      setIsCloudModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      await saveToGithub(cloudSettings, expenses);
      const now = new Date().toLocaleString();
      const newSettings = { ...cloudSettings, lastSync: now };
      setCloudSettings(newSettings);
      localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(newSettings));
      alert("Nuvem atualizada!");
    } catch (err) {
      alert("Erro na sincronização.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudLoad = async () => {
    if (!cloudSettings.githubToken || !cloudSettings.gistId) {
      setIsCloudModalOpen(true);
      return;
    }
    if (!window.confirm("Substituir dados locais pelos da nuvem?")) return;
    
    setIsSyncing(true);
    try {
      const cloudData = await loadFromGithub(cloudSettings);
      setExpenses(cloudData);
      alert("Dados recuperados!");
    } catch (err) {
      alert("Erro ao carregar.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenAddModal = (dateStr?: string) => {
    if (isReadOnly) return;
    setEditingExpense(null);
    setFormData({
      date: dateStr || new Date().toISOString().split('T')[0],
      category: 'Outros',
      amount: 0,
      description: '',
      driveLink: '',
      receiptImage: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    if (isReadOnly) return;
    setEditingExpense(expense);
    setFormData({ ...expense });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    if (window.confirm('Excluir lançamento?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? { ...formData, id: exp.id } : exp));
    } else {
      setExpenses(prev => [...prev, { ...formData, id: generateId() }]);
    }
    setIsModalOpen(false);
  };

  const handleCaptureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        setFormData(prev => ({ ...prev, receiptImage: base64 }));
      } catch (err) { console.error(err); }
    }
  };

  const changeMonth = (offset: number) => {
    let newMonth = selectedMonth + offset;
    let newYear = selectedYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32 lg:pb-8">
      {/* Header */}
      <header className="no-print bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <CreditCard size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Finanças Pro</h1>
              {cloudSettings.gistId && <CheckCircle2 size={16} className="text-emerald-500" />}
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              {cloudSettings.lastSync ? `Sync: ${cloudSettings.lastSync.split(',')[1]}` : 'Offline Mode'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1.5 border border-slate-200">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500"><ChevronLeft size={18} /></button>
            <div className="px-4 text-sm font-black text-slate-700 min-w-[140px] text-center">
              {MONTHS[selectedMonth].label} {selectedYear}
            </div>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500"><ChevronRight size={18} /></button>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => exportToCSV(filteredExpenses)} className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shadow-sm transition-all" title="Exportar CSV">
              <FileText size={20} />
            </button>
            <button onClick={() => window.print()} className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shadow-sm transition-all" title="Imprimir">
              <Printer size={20} />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button 
              onClick={handleCloudSave} 
              disabled={isSyncing}
              className={`p-2.5 rounded-xl transition-all ${isSyncing ? 'bg-slate-50 text-slate-300' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              title="Sincronizar Nuvem"
            >
              <Cloud size={20} className={isSyncing ? 'animate-pulse' : ''} />
            </button>
            <button onClick={() => setIsCloudModalOpen(true)} className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Calendar 
            month={selectedMonth} 
            year={selectedYear} 
            selectedDate={null} 
            onSelectDate={handleOpenAddModal}
            expenses={filteredExpenses}
          />

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lançamentos</h2>
              <button onClick={() => handleOpenAddModal()} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 transition-all uppercase tracking-widest">
                <Plus size={14} /> Novo
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Dia</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredExpenses.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 italic text-sm font-medium">Nenhum registro encontrado.</td></tr>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{expense.date.split('-')[2]}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase">{expense.category}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">{expense.description || '---'}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(expense)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(expense.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
           <CategorySummary expenses={filteredExpenses} />
        </div>
      </main>

      {/* Modal Nuvem */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2">Configurações</h3>
              <button onClick={() => setIsCloudModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GitHub Token</label>
                  <input type="password" value={cloudSettings.githubToken} onChange={(e) => setCloudSettings(p => ({ ...p, githubToken: e.target.value }))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gist ID</label>
                  <input type="text" value={cloudSettings.gistId} onChange={(e) => setCloudSettings(p => ({ ...p, gistId: e.target.value }))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none focus:border-indigo-500 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleCloudLoad} className="flex-1 py-3 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl hover:bg-emerald-100 uppercase tracking-widest">Importar</button>
                <button onClick={() => { localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudSettings)); setIsCloudModalOpen(false); }} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 uppercase tracking-widest">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-lg font-black">{editingExpense ? 'Editar' : 'Novo Lançamento'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor (R$)</label>
                <input type="number" step="0.01" required value={formData.amount || ''} onChange={(e) => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-3xl font-black text-slate-900 outline-none focus:border-indigo-500 transition-all" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                  <select value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value as Category }))} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mt-1 outline-none focus:border-indigo-500" placeholder="Ex: Mercado do mês" />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest pt-5">
                Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB Mobile */}
      {!isReadOnly && (
        <button onClick={() => handleOpenAddModal()} className="no-print fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center lg:hidden z-40 active:scale-90 transition-all">
          <Plus size={32} />
        </button>
      )}
    </div>
  );
};

export default App;