import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Camera, 
  X, 
  ExternalLink,
  CreditCard,
  Cloud,
  Settings,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Download,
  Upload,
  FileJson,
  Database
} from 'lucide-react';
import { Expense, Category, CloudSettings } from './types';
import { CATEGORIES, MONTHS, STORAGE_KEY } from './constants';
import { 
  generateId, 
  formatCurrency, 
  toBase64, 
  saveToGithub, 
  exportToJSON, 
  importFromJSON 
} from './utils';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

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
  const jsonImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedCloud = localStorage.getItem(CLOUD_STORAGE_KEY);
      if (savedCloud) setCloudSettings(JSON.parse(savedCloud));
      
      const savedExpenses = localStorage.getItem(STORAGE_KEY);
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      }
    } catch (e) {
      console.error("Erro no carregamento:", e);
    } finally {
      setIsInitialLoadDone(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialLoadDone) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, isInitialLoadDone]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date + 'T12:00:00');
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
      alert("Sincronizado com o GitHub!");
    } catch (err) {
      alert("Erro na sincronização.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJSON = () => {
    exportToJSON(expenses);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm("Isso substituirá todos os dados atuais. Deseja continuar?")) {
        try {
          const imported = await importFromJSON(file);
          setExpenses(imported);
          alert("Dados importados com sucesso!");
          setIsCloudModalOpen(false);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Erro ao importar.");
        }
      }
    }
    // Limpar o input para permitir importar o mesmo arquivo novamente
    if (e.target) e.target.value = '';
  };

  const handleOpenAddModal = (dateStr?: string) => {
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
    setEditingExpense(expense);
    setFormData({ ...expense });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este lançamento?')) {
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
      } catch (err) {
        alert("Erro ao processar imagem.");
      }
    }
  };

  if (!isInitialLoadDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-indigo-600 font-black text-xl">
        INICIANDO GESTOR PRO...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header className="no-print bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
            <CreditCard size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Finanças Pro</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {cloudSettings.lastSync ? `Sincronizado: ${cloudSettings.lastSync}` : '● Armazenamento Local'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={18} /></button>
            <span className="px-4 text-sm font-black text-slate-700 min-w-[140px] text-center uppercase tracking-tighter">{MONTHS[selectedMonth].label} {selectedYear}</span>
            <button onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={18} /></button>
          </div>
          <button onClick={handleCloudSave} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all" title="Sincronizar GitHub"><Cloud size={20} /></button>
          <button onClick={() => setIsCloudModalOpen(true)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Backup e Configurações"><Database size={20} /></button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Calendar month={selectedMonth} year={selectedYear} selectedDate={null} onSelectDate={handleOpenAddModal} expenses={filteredExpenses} />
          
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lançamentos do Mês</h2>
              <button onClick={() => handleOpenAddModal()} className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 uppercase tracking-widest transition-all">Novo Gasto</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-slate-400 uppercase text-[10px] font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Dia</th>
                    <th className="px-6 py-4">Categoria/Nota</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredExpenses.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-300 italic">Nenhum registro encontrado.</td></tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{exp.date.split('-')[2]}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black uppercase rounded text-slate-500 mb-1 block w-fit">{exp.category}</span>
                          <div className="text-xs text-slate-400 truncate max-w-[150px]">{exp.description || '---'}</div>
                          {exp.driveLink && (
                            <a href={exp.driveLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 font-black mt-1 flex items-center gap-1 hover:underline">
                              <ExternalLink size={10} /> Link Drive
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(exp.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(exp)} className="p-2 text-slate-300 hover:text-indigo-600"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
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
        <aside>
          <CategorySummary expenses={filteredExpenses} />
        </aside>
      </main>

      {/* MODAL DE DESPESA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{editingExpense ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor da Despesa (R$)</label>
                  <input 
                    type="number" step="0.01" required 
                    value={formData.amount || ''} 
                    onChange={(e) => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} 
                    className="w-full bg-transparent text-5xl font-black text-indigo-600 outline-none placeholder-slate-200" 
                    placeholder="0,00" autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoria</label>
                    <select 
                      value={formData.category} 
                      onChange={(e) => setFormData(p => ({ ...p, category: e.target.value as Category }))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data</label>
                    <input 
                      type="date" required
                      value={formData.date} 
                      onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Descrição / Nota</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500" 
                    placeholder="Ex: Farmácia Mensal" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="mb-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon size={14} /> Comprovantes e Links
                  </h4>
                </div>

                <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-2xl p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                      <LinkIcon size={12} /> Link do Google Drive
                    </label>
                    <input 
                      type="url" 
                      value={formData.driveLink} 
                      onChange={(e) => setFormData(p => ({ ...p, driveLink: e.target.value }))} 
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/50 placeholder-indigo-200"
                      placeholder="https://drive.google.com/..." 
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block flex items-center gap-1">
                      <Camera size={12} /> Captura de Recibo
                    </label>
                    
                    {!formData.receiptImage ? (
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 bg-white border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-indigo-400 hover:text-indigo-600 hover:bg-white transition-all group"
                      >
                        <div className="p-4 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform">
                          <Camera size={32} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Tirar Foto do Comprovante</span>
                      </button>
                    ) : (
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-md border-2 border-white">
                        <img src={formData.receiptImage} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setFormData(p => ({ ...p, receiptImage: '' }))}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      onChange={handleCaptureImage}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-white">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all active:scale-[0.98]"
                >
                  {editingExpense ? 'Confirmar Alterações' : 'Salvar Novo Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB Mobile */}
      <button 
        onClick={() => handleOpenAddModal()} 
        className="no-print lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40"
      >
        <Plus size={32} />
      </button>

      {/* Cloud & Backup Modal */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest">Backup & Dados</span>
              </div>
              <button onClick={() => setIsCloudModalOpen(false)} className="hover:text-red-400 transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* BACKUP LOCAL (JSON) */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Backup Local (Arquivo JSON)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleExportJSON}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                  >
                    <Download size={20} className="text-slate-400 group-hover:text-indigo-600" />
                    <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-indigo-600">Exportar</span>
                  </button>
                  <button 
                    onClick={() => jsonImportRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                  >
                    <Upload size={20} className="text-slate-400 group-hover:text-emerald-600" />
                    <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-emerald-600">Importar</span>
                  </button>
                  <input 
                    ref={jsonImportRef}
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleImportJSON} 
                  />
                </div>
              </div>

              {/* SINCRONIZAÇÃO NUVEM (GITHUB) */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Nuvem (GitHub Gist)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">GitHub Token</label>
                    <input 
                      type="password" placeholder="ghp_xxxxxxxxxxxx" 
                      value={cloudSettings.githubToken} 
                      onChange={e => setCloudSettings(p => ({...p, githubToken: e.target.value}))} 
                      className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50/50" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gist ID</label>
                    <input 
                      type="text" placeholder="ID do Gist" 
                      value={cloudSettings.gistId} 
                      onChange={e => setCloudSettings(p => ({...p, gistId: e.target.value}))} 
                      className="w-full border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50/50" 
                    />
                  </div>
                  <button 
                    onClick={() => { localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(cloudSettings)); setIsCloudModalOpen(false); }} 
                    className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;