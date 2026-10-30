// Indian Rupee & Number Formatters

export function formatINR(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
}

export function formatNumber(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
}

export function formatPercent(val: number, includeSign = false): string {
  if (isNaN(val) || val === null || val === undefined) return '0%';
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonth(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
  });
}

export function getStatusBadge(status: 'healthy' | 'watch' | 'action_needed' | 'opportunity') {
  switch (status) {
    case 'healthy':
      return {
        label: 'Healthy',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'watch':
      return {
        label: 'Watch',
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'action_needed':
      return {
        label: 'Action Needed',
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'opportunity':
      return {
        label: 'Opportunity',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
        dot: 'bg-indigo-500',
      };
  }
}
