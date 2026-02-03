
import React from 'react';
import { WEEK_DAYS } from '../constants';

interface CalendarProps {
  month: number;
  year: number;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  expenses: { date: string }[];
}

const Calendar: React.FC<CalendarProps> = ({ month, year, selectedDate, onSelectDate, expenses }) => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const hasExpenses = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return expenses.some(e => e.date === dateStr);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(dateStr)}
              className={`h-10 sm:h-12 flex flex-col items-center justify-center rounded-lg transition-all relative ${
                isSelected 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-slate-50 text-slate-700'
              } ${isToday(day) && !isSelected ? 'border-2 border-indigo-200' : ''}`}
            >
              <span className="text-sm font-bold">
                {day}
              </span>
              {hasExpenses(day) && (
                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
