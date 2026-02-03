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
  const [error, setError] = useState<string | null>(null);

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
      console.error("Erro Supabase:", err);
      if (err.message?.includes('RLS')) {
        setError("Erro de permissão no banco (RLS).");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
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
    if (!isSupabaseConfigured) {
      alert("Configure o Supabase no seu painel de deploy (VITE_SUPABASE_URL e KEY).");
      return;
    }

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
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured) return;
    if (!window.confirm('Excluir?')) return;
    try {
      await supabase.from('expenses').delete().eq('id', id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase text-indigo-600">Sincronizando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 text-xs font-bold">
          <AlertCircle size={18} />
          <p>Modo offline/leitura. Configure as chaves do banco no deploy para salvar dados.</p>
        </div>
      )}

      <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800">Finanças Pro</h1>
            <p className="text-[10px] font-black uppercase text-slate-400">Gestão Mensal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)} className="p-2"><ChevronLeft size={16} /></button>
            <span className="px-4 text-xs font-black min-w-[120px] text-center uppercase">{MONTHS[selectedMonth].label} {selectedYear}</span>
            <button onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)} className="p-2"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => exportToJSON(expenses)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400"><Download size={18} /></button>
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
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extrato</h2>
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase">Novo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {filteredExpenses.length === 0 ? (
                    <tr><td className="p-12 text-center text-slate-400 text-sm">Nenhum dado.</td></tr>
                  ) : filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="px-6 py-4 text-xs font-black text-slate-400 w-16">{exp.date.split('-')[2]}</td>
                      <td className="px-6 py-4">
                        <span className="text-[8px] font-black uppercase text-indigo-500 block">{exp.category}</span>
                        <div className="text-xs font-bold text-slate-700">{exp.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(exp.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingExpense(exp); setFormData(exp); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600"><Edit2 size={14}/></button>
                          <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black uppercase text-slate-400 text-[10px]">Lançamento</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300"><X size={20}/></button>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Valor</label>
                  <input type="number" step="0.01" required autoFocus value={formData.amount || ''} onChange={e => setFormData(p => ({...p, amount: parseFloat(e.target.value)}))} className="w-full text-4xl font-black text-indigo-600 outline-none border-b-2 border-slate-100 focus:border-indigo-600 py-2 bg-transparent" placeholder="0,00" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Categoria</label>
                    <select value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value as Category}))} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-xs border border-slate-100">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Data</label>
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} className="w-full bg-slate-50 p-3 rounded-xl font-bold text-xs border border-slate-100" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-lg">Salvar</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;