/**
 * Conectores de agenda
 *
 * Soporta:
 * - Calendly (calendly.com/...)
 * - Cal.com (cal.com/...)
 * - TidyCal (tidycal.com/...)
 * - Google Calendar booking link
 * - Custom (cualquier URL del cliente)
 *
 * El motor n8n lee `agenda_url` y lo envía al lead cuando llega a etapa 11.
 */

export type AgendaProveedor = 'calendly' | 'cal_com' | 'tidycal' | 'google_calendar' | 'custom'

export type ProveedorInfo = {
  id: AgendaProveedor
  nombre: string
  logo: string // emoji o icon name
  patron: RegExp
  ejemplo: string
  instrucciones: string
}

export const PROVEEDORES: ProveedorInfo[] = [
  {
    id: 'calendly',
    nombre: 'Calendly',
    logo: '📅',
    patron: /^https:\/\/calendly\.com\/[^\/\s]+/i,
    ejemplo: 'https://calendly.com/tu-usuario/llamada-30min',
    instrucciones: 'Tu link público de Calendly. Lo encontrás en Account → Share your link.',
  },
  {
    id: 'cal_com',
    nombre: 'Cal.com',
    logo: '🗓️',
    patron: /^https:\/\/cal\.com\/[^\/\s]+/i,
    ejemplo: 'https://cal.com/tu-usuario/30min',
    instrucciones: 'Tu link de Cal.com (alternativa open-source a Calendly).',
  },
  {
    id: 'tidycal',
    nombre: 'TidyCal',
    logo: '✨',
    patron: /^https:\/\/tidycal\.com\/[^\/\s]+/i,
    ejemplo: 'https://tidycal.com/tu-usuario/llamada',
    instrucciones: 'Tu link de TidyCal (de AppSumo).',
  },
  {
    id: 'google_calendar',
    nombre: 'Google Calendar',
    logo: '🟦',
    patron: /^https:\/\/calendar\.app\.google\/[^\/\s]+/i,
    ejemplo: 'https://calendar.app.google/abc123xyz',
    instrucciones: 'Tu booking link de Google Calendar (Calendar → Appointment scheduling).',
  },
  {
    id: 'custom',
    nombre: 'Link personalizado',
    logo: '🔗',
    patron: /^https?:\/\//i,
    ejemplo: 'https://acelerame.online/agendar.html',
    instrucciones: 'Cualquier URL pública (tu propia página, Acuity, SavvyCal, etc.)',
  },
]

/**
 * Detecta el proveedor a partir de una URL
 */
export function detectarProveedor(url: string): AgendaProveedor | null {
  if (!url) return null
  // Probar cada proveedor SALVO custom (que matchea cualquier https)
  for (const p of PROVEEDORES) {
    if (p.id === 'custom') continue
    if (p.patron.test(url)) return p.id
  }
  // Fallback a custom si es un URL válido
  try {
    const u = new URL(url)
    if (['http:', 'https:'].includes(u.protocol)) return 'custom'
  } catch {}
  return null
}

/**
 * Valida que la URL sea un link de agenda válido.
 * Solo verifica formato. La validación HTTP real va en el servidor.
 */
export function validarUrlAgenda(url: string): { ok: true; proveedor: AgendaProveedor } | { ok: false; error: string } {
  if (!url || typeof url !== 'string') return { ok: false, error: 'URL vacía' }
  const trimmed = url.trim()
  if (trimmed.length > 500) return { ok: false, error: 'URL muy larga' }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'URL inválida' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Solo se aceptan URLs http o https' }
  }

  const proveedor = detectarProveedor(trimmed)
  if (!proveedor) return { ok: false, error: 'No se pudo identificar un proveedor de agenda' }

  return { ok: true, proveedor }
}

/**
 * Hace una request HEAD/GET ligera para verificar que el link responde 200.
 * Se usa solo en el server (route handler).
 */
export async function pingAgenda(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 ACELERAME-validator' },
    })
    clearTimeout(timeout)

    // Algunos servicios no responden bien a HEAD, probamos GET
    if (res.status === 405 || res.status === 501) {
      const ctrl2 = new AbortController()
      const tm2 = setTimeout(() => ctrl2.abort(), 5000)
      const res2 = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl2.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 ACELERAME-validator' },
      })
      clearTimeout(tm2)
      return { ok: res2.ok, status: res2.status }
    }

    return { ok: res.ok, status: res.status }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de red' }
  }
}
