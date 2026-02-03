import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, X, CreditCard, ChevronLeft, ChevronRight, Download, AlertCircle
} from 'lucide-react';
import { Expense, Category } from './types';
import { CATEGORIES, MONTHS } from './constants';
import { formatCurrency, exportToJSON } from './utils';
import Calendar from './components/Calendar';
import CategorySummary from './components/CategorySummary';
import { supabase, isSupabaseConfigured } from './supabase';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(isSupabaseConfigured ? null : "Configuração do banco de dados não encontrada.");

  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Outros',
    amount: 0,
    description: '',
    driveLink: '',
    receiptImage: ''
  });

  const fetchExpenses = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: sbError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: true });
      
      if (sbError) throw sbError;
      if (data) setExpenses(data);
      setError(null);
    } catch (err: any) {
      console.error("Erro crítico ao carregar dados:", err);
      setError(`Erro de conexão: ${err.message || "Verifique sua conexão com a internet."}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchExpenses();
    }
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T12:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;

    try {
      if (editingExpense) {
        const { error: err } = await supabase.from('expenses').update(formData).eq('id', editingExpense.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('expenses').insert([formData]);
        if (err) throw err;
      }
      await fetchExpenses();
      setIsModalOpen(false);
      setEditingExpense(null);
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured) return;
    if (!window.confirm('Excluir este lançamento?')) return;
    try {
      const { error: err } = await supabase.from('expenses').delete().eq('id', id);
      if (err) throw err;
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Ops! Algo deu errado</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px]"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Sincronizando Nuvem...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">Finanças Pro</h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gestor em Tempo Real</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronLeft size={16} /></button>
            <span className="px-4 text-xs font-black min-w-[120px] text-center uppercase">{MONTHS[selectedMonth].label} {selectedYear}</span>
            <button onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => exportToJSON(expenses)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm transition-colors"><Download size={18} /></button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Calendar 
            month={selectedMonth} 
            year={selectedYear} 
            selectedDate={null} 
            onSelectDate={(d) => {
              setEditingExpense(null);
              setFormData({date: d, category: 'Outros', amount: 0, description: '', driveLink: '', receiptImage: ''});
              setIsModalOpen(true);
            }} 
            expenses={filteredExpenses} 
          />
          
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fluxo de Caixa</h2>
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors uppercase tracking-widest">Novo Registro</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {filteredExpenses.length === 0 ? (
                    <tr><td className="p-12 text-center text-slate-400 font-medium italic text-sm">Nenhum lançamento encontrado.</td></tr>
                  ) : filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-slate-400 w-16">{exp.date.split('-')[2]}</td>
                      <td className="px-6 py-4">
                        <span className="text-[8px] font-black uppercase text-indigo-500 block mb-0.5">{exp.category}</span>
                        <div className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{exp.description || 'Sem descrição'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(exp.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingExpense(exp); setFormData(exp); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14}/></button>
                          <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside><CategorySummary expenses={filteredExpenses} /></aside>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Dados do Lançamento</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600"><X size={20}/></button>
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Valor (R$)</label>
                  <input 
                    type="number" step="0.01" required autoFocus
                    value={formData.amount || ''} 
                    onChange={e => setFormData(p => ({...p, amount: parseFloat(e.target.value)}))}
                    className="w-full text-4xl font-black text-indigo-600 outline-none border-b-2 border-slate-100 focus:border-indigo-600 py-2 transition-colors bg-transparent"
                    placeholder="0,00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Categoria</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData(p => ({...p, category: e.target.value as Category}))}
                      className="w-full bg-slate-50 p-3 rounded-xl font-bold text-xs border border-slate-100 focus:ring-2 focus:ring-indigo-100 outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Data</label>
                    <input 
                      type="date" value={formData.date} 
                      onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                      className="w-full bg-slate-50 p-3 rounded-xl font-bold text-xs border border-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Descrição</label>
                  <input 
                    type="text" placeholder="Ex: Farmácia São João" 
                    value={formData.description} 
                    onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                    className="w-full bg-slate-50 p-3 rounded-xl font-bold text-xs border border-slate-100 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                  {editingExpense ? 'Atualizar Dados' : 'Salvar na Nuvem'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;