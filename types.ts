
export type Category = 
  | 'Farmácias' 
  | 'Material Hospitalar' 
  | 'Hortifruti' 
  | 'Mercado' 
  | 'Limpeza' 
  | 'Vestuário' 
  | 'Consultas' 
  | 'Cuidadoras' 
  | 'Outros';

export interface Expense {
  id: string;
  date: string; // ISO string format YYYY-MM-DD
  category: Category;
  amount: number;
  description: string;
  driveLink: string;
  receiptImage?: string; // base64 string
}

export interface CloudSettings {
  githubToken: string;
  gistId: string;
  lastSync?: string;
}

export interface MonthOption {
  value: number;
  label: string;
}

export interface AppState {
  expenses: Expense[];
  selectedMonth: number; // 0-11
  selectedYear: number;
}
