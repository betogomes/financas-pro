import React from 'react';
import { Expense } from '../types';
import { CATEGORIES } from '../constants';
import { formatCurrency } from '../utils';

interface CategorySummaryProps {
  expenses: Expense[];
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#71717a', '#f43f5e'
];

const CategorySummary: React.FC<CategorySummaryProps> = ({ expenses }) => {
  const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total do Período</h3>
          <div className="text-3xl font-black text-indigo-600 tracking-tight">{formatCurrency(totalMonthly)}</div>
        </div>
        
        <div className="space-y-5">
          {CATEGORIES.map((cat, idx) => {
            const total = expenses
              .filter(e => e.category === cat)
              .reduce((sum, e) => sum + e.amount, 0);
            
            if (total === 0) return null;
            const percentage = (total / totalMonthly) * 100;

            return (
              <div key={cat} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-xs font-bold text-slate-700">{cat}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{formatCurrency(total)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      backgroundColor: COLORS[idx % COLORS.length],
                      width: `${percentage}%`
                    }}
                  />
                </div>
                <div className="text-[9px] text-right text-slate-400 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {percentage.toFixed(1)}% do total
                </div>
              </div>
            );
          })}
          {totalMonthly === 0 && (
            <div className="py-8 text-center text-slate-400 italic text-sm">
              Sem dados para este mês.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySummary;