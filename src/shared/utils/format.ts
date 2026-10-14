/** Formatea un numero como moneda ARS. Centralizado para mantener consistencia en toda la app. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/** Genera un numero de seguimiento simulado, ej: PTX-7F3K9A2B1 */
export function generateTrackingNumber(): string {
  const random = Math.random().toString(36).slice(2, 11).toUpperCase();
  return `PTX-${random}`;
}
