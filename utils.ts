import { Expense, CloudSettings } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '--/--/----';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
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
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.amount.toString().replace('.', ','),
    e.driveLink || ''
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

export const exportToJSON = (expenses: Expense[]) => {
  const dataStr = JSON.stringify(expenses, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_financas_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importFromJSON = (file: File): Promise<Expense[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          resolve(json);
        } else {
          reject(new Error("Formato de arquivo inválido. Esperado uma lista de despesas."));
        }
      } catch (err) {
        reject(new Error("Erro ao ler o arquivo JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Erro no upload do arquivo."));
    reader.readAsText(file);
  });
};

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${response.status}: Falha ao salvar no GitHub`);
  }
  return await response.json();
};

export const loadFromGithub = async (settings: CloudSettings): Promise<Expense[]> => {
  if (!settings.githubToken || !settings.gistId) throw new Error("Configurações de nuvem incompletas");

  const response = await fetch(`https://api.github.com/gists/${settings.gistId}`, {
    headers: {
      'Authorization': `token ${settings.githubToken}`,
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${response.status}: Falha ao carregar do GitHub`);
  }
  const data = await response.json();
  const content = data.files["financas.json"]?.content;
  
  if (!content) return [];
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Erro ao processar JSON do Gist", e);
    return [];
  }
};