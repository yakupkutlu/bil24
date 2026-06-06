export const money = (value = 0, currency = 'TRY') => new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value);
export const formatCurrency = money;
export const dateTime = (value?: string) => value ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
export const formatDateTime = dateTime;
export const shortDate = (value?: string) => value ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(value)) : '-';
