import { Expense, CloudSettings } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const toBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

export const exportToCSV = (expenses: Expense[]) => {
  const headers = ['Data', 'Categoria', 'Descricao', 'Valor', 'Link Drive'];
  const rows = expenses.map(e => [
    e.date,
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount.toString().replace('.', ','),
    e.driveLink
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `financas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Funções de Nuvem (GitHub API)
export const saveToGithub = async (settings: CloudSettings, expenses: Expense[]) => {
  if (!settings.githubToken || !settings.gistId) throw new Error("Configurações de nuvem incompletas");

  const response = await fetch(`https://api.github.com/gists/${settings.gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${settings.githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        "financas.json": {
          content: JSON.stringify(expenses, null, 2)
        }
      }
    })
  });

  if (!response.ok) throw new Error("Falha ao salvar no GitHub");
  return await response.json();
};

export const loadFromGithub = async (settings: CloudSettings): Promise<Expense[]> => {
  if (!settings.githubToken || !settings.gistId) throw new Error("Configurações de nuvem incompletas");

  const response = await fetch(`https://api.github.com/gists/${settings.gistId}`, {
    headers: {
      'Authorization': `token ${settings.githubToken}`,
    }
  });

  if (!response.ok) throw new Error("Falha ao carregar do GitHub");
  const data = await response.json();
  const content = data.files["financas.json"]?.content;
  
  if (!content) return [];
  return JSON.parse(content);
};