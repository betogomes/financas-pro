import { Category, MonthOption } from './types';

// Finance Pro Constants - Build Ref: 1.1.6
export const CATEGORIES: Category[] = [
  'Farmácias',
  'Material Hospitalar',
  'Hortifruti',
  'Mercado',
  'Limpeza',
  'Vestuário',
  'Consultas',
  'Cuidadoras',
  'Outros'
];

export const MONTHS: MonthOption[] = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' }
];

export const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const STORAGE_KEY = 'finance_pro_data';