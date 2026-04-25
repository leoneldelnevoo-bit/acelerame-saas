/**
 * Utilidades comunes del SaaS
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Formatea números: 17775 → "17.775"
 */
export function formatNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '0'
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return '0'
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(num)
}

/**
 * Formatea USD: 199.99 → "$199.99"
 */
export function formatUSD(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '$0.00'
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * "hace 2 horas", "hace 3 días"
 */
export function timeAgo(date: string | Date): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diff = now.getTime() - then.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 7) return `hace ${days}d`
  if (weeks < 4) return `hace ${weeks} sem`
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`
  return then.toLocaleDateString('es-AR')
}

/**
 * Genera slug a partir de string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * Genera nombre de schema válido para Postgres a partir de slug de cliente
 * Ej: "Sukhafé Café" → "cliente_sukhafe_cafe"
 */
export function clienteSchemaName(slug: string): string {
  const clean = slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return `cliente_${clean}`.substring(0, 63) // postgres max 63 chars
}

/**
 * Truncate text helper
 */
export function truncate(text: string, max: number = 100): string {
  if (!text) return ''
  if (text.length <= max) return text
  return text.substring(0, max) + '…'
}
