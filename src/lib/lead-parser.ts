/**
 * Parser universal de leads
 *
 * Soporta:
 * - CSV (con coma, punto y coma, tab)
 * - Excel (.xlsx, .xls) — vía SheetJS
 * - JSON (array de objetos)
 * - Google Sheets (URL pública)
 * - Supabase externo (vía URL + anon key)
 *
 * Auto-detecta columnas por nombre con sinónimos en es/en.
 */

import * as XLSX from 'xlsx'

export type LeadRow = {
  handle: string
  nombre?: string | null
  bio?: string | null
  email?: string | null
  telefono?: string | null
  score?: number | null
  mensaje_enviado?: string | null
  fuente?: string | null
}

export type ImportPreview = {
  total: number
  validos: number
  duplicados: number
  errores: Array<{ fila: number; error: string }>
  primerasFilas: LeadRow[] // primeras 10 para preview
  columnasMapeadas: Record<string, string> // {handle: "Username", nombre: "Full Name"}
  columnasOriginales: string[]
}

// ===================================================================
// Sinónimos para auto-detectar columnas
// ===================================================================
const SINONIMOS: Record<keyof LeadRow, string[]> = {
  handle: ['handle', 'username', 'usuario', 'user', 'instagram', 'ig', '@', 'cuenta', 'arroba', 'account', 'profile_name'],
  nombre: ['nombre', 'name', 'full_name', 'fullname', 'full name', 'display_name', 'displayname', 'first_name'],
  bio: ['bio', 'biography', 'descripcion', 'description', 'about', 'sobre'],
  email: ['email', 'mail', 'correo', 'e-mail', 'e_mail', 'electronic_mail'],
  telefono: ['telefono', 'phone', 'celular', 'mobile', 'whatsapp', 'wa', 'tel'],
  score: ['score', 'puntaje', 'rating', 'calificacion', 'puntuacion', 'value'],
  mensaje_enviado: ['mensaje', 'message', 'msg', 'dm', 'opening', 'cold_message', 'first_message'],
  fuente: ['fuente', 'source', 'origen', 'origin', 'where', 'from'],
}

/**
 * Mapea columnas originales a campos del sistema.
 * Ej: {"Username": "handle", "Full Name": "nombre"}
 */
export function detectarMapeo(columnas: string[]): { mapeo: Record<string, string>; ambiguas: string[] } {
  const normalizar = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')

  const mapeo: Record<string, string> = {}
  const ambiguas: string[] = []

  for (const col of columnas) {
    const norm = normalizar(col)
    let mejorMatch: { campo: string; score: number } | null = null

    for (const [campo, sinonimos] of Object.entries(SINONIMOS)) {
      for (const sin of sinonimos) {
        const sinNorm = normalizar(sin)
        // match exacto = score 100, match parcial = score 50
        if (norm === sinNorm) {
          if (!mejorMatch || mejorMatch.score < 100) mejorMatch = { campo, score: 100 }
        } else if (norm.includes(sinNorm) || sinNorm.includes(norm)) {
          if (!mejorMatch || mejorMatch.score < 50) mejorMatch = { campo, score: 50 }
        }
      }
    }

    if (mejorMatch) {
      // Solo asignar si no hay otra columna ya asignada a ese campo con mejor score
      const yaUsado = Object.entries(mapeo).find(([, c]) => c === mejorMatch!.campo)
      if (!yaUsado) {
        mapeo[col] = mejorMatch.campo
      } else {
        ambiguas.push(col)
      }
    }
  }

  return { mapeo, ambiguas }
}

// ===================================================================
// Limpieza de handle
// ===================================================================
export function limpiarHandle(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null
  let h = raw.trim()
  // Quitar @, https://instagram.com/, etc.
  h = h.replace(/^@/, '')
  h = h.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
  h = h.replace(/\/$/, '')
  // Validar caracteres permitidos
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(h)) return null
  return h.toLowerCase()
}

// ===================================================================
// CSV
// ===================================================================
export function parseCSV(content: string): { columnas: string[]; filas: Record<string, any>[] } {
  // Detectar separador (coma, ; o tab)
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { columnas: [], filas: [] }

  const sample = lines[0]
  const sep = sample.split(';').length > sample.split(',').length
    ? ';'
    : sample.split('\t').length > sample.split(',').length
    ? '\t'
    : ','

  const splitLine = (line: string): string[] => {
    // Maneja comillas básicas
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === sep && !inQuotes) {
        result.push(current); current = ''
      } else current += ch
    }
    result.push(current)
    return result.map((s) => s.trim())
  }

  const columnas = splitLine(lines[0])
  const filas = lines.slice(1).map((line) => {
    const valores = splitLine(line)
    const obj: Record<string, any> = {}
    columnas.forEach((col, i) => { obj[col] = valores[i] ?? '' })
    return obj
  })

  return { columnas, filas }
}

// ===================================================================
// Excel (.xlsx, .xls)
// ===================================================================
export function parseExcel(buffer: ArrayBuffer): { columnas: string[]; filas: Record<string, any>[] } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, any>[]
  if (json.length === 0) return { columnas: [], filas: [] }
  const columnas = Object.keys(json[0])
  return { columnas, filas: json }
}

// ===================================================================
// JSON (array de objetos)
// ===================================================================
export function parseJSON(content: string): { columnas: string[]; filas: Record<string, any>[] } {
  try {
    const parsed = JSON.parse(content)
    const arr = Array.isArray(parsed) ? parsed : (parsed.data || parsed.items || parsed.leads)
    if (!Array.isArray(arr) || arr.length === 0) return { columnas: [], filas: [] }
    const columnas = Object.keys(arr[0])
    return { columnas, filas: arr }
  } catch {
    return { columnas: [], filas: [] }
  }
}

// ===================================================================
// Google Sheets (URL pública)
// ===================================================================
export async function parseGoogleSheet(url: string): Promise<{ columnas: string[]; filas: Record<string, any>[] }> {
  // Convertir URL de edición a CSV
  // https://docs.google.com/spreadsheets/d/{ID}/edit -> /export?format=csv
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) throw new Error('URL de Google Sheets inválida')
  const sheetId = match[1]
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

  const ctrl = new AbortController()
  const tm = setTimeout(() => ctrl.abort(), 15000)
  const res = await fetch(exportUrl, { signal: ctrl.signal })
  clearTimeout(tm)

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('La hoja no es pública. Hacela "Anyone with the link can view".')
    }
    throw new Error(`Error ${res.status} accediendo a Google Sheets`)
  }
  const csv = await res.text()
  return parseCSV(csv)
}

// ===================================================================
// Supabase externo (lectura via REST)
// ===================================================================
export async function parseSupabase(opts: {
  url: string
  anonKey: string
  tabla: string
}): Promise<{ columnas: string[]; filas: Record<string, any>[] }> {
  if (!opts.url || !opts.anonKey || !opts.tabla) {
    throw new Error('Faltan url, anonKey o tabla')
  }
  // Sanitizar nombre tabla (evitar SQL inj)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(opts.tabla)) {
    throw new Error('Nombre de tabla inválido')
  }

  const baseUrl = opts.url.replace(/\/$/, '')
  const ctrl = new AbortController()
  const tm = setTimeout(() => ctrl.abort(), 30000)

  // Limitar a 5000 filas para no saturar
  const res = await fetch(`${baseUrl}/rest/v1/${opts.tabla}?limit=5000`, {
    headers: {
      apikey: opts.anonKey,
      Authorization: `Bearer ${opts.anonKey}`,
    },
    signal: ctrl.signal,
  })
  clearTimeout(tm)

  if (!res.ok) {
    throw new Error(`Supabase respondió ${res.status}: ${await res.text().catch(() => '')}`)
  }

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    return { columnas: [], filas: [] }
  }
  const columnas = Object.keys(data[0])
  return { columnas, filas: data }
}

// ===================================================================
// Aplicar mapeo y limpiar filas
// ===================================================================
export function aplicarMapeo(
  filas: Record<string, any>[],
  mapeo: Record<string, string>
): { leadsLimpios: LeadRow[]; errores: Array<{ fila: number; error: string }>; duplicados: number } {
  const leads: LeadRow[] = []
  const errores: Array<{ fila: number; error: string }> = []
  const handlesVistos = new Set<string>()
  let duplicados = 0

  for (let i = 0; i < filas.length; i++) {
    const filaOriginal = filas[i]
    const lead: any = {}

    // Aplicar mapeo
    for (const [colOrig, campo] of Object.entries(mapeo)) {
      lead[campo] = filaOriginal[colOrig]
    }

    // Validación handle
    const handle = limpiarHandle(lead.handle ?? '')
    if (!handle) {
      errores.push({ fila: i + 2, error: 'Handle vacío o inválido' })
      continue
    }
    if (handlesVistos.has(handle)) {
      duplicados++
      continue
    }
    handlesVistos.add(handle)

    // Coerciones
    const score = lead.score != null ? parseFloat(String(lead.score).replace(',', '.')) : null
    const finalLead: LeadRow = {
      handle,
      nombre: lead.nombre ? String(lead.nombre).trim().substring(0, 200) : null,
      bio: lead.bio ? String(lead.bio).trim().substring(0, 500) : null,
      email: lead.email ? String(lead.email).trim().toLowerCase() : null,
      telefono: lead.telefono ? String(lead.telefono).trim() : null,
      score: score && !isNaN(score) ? Math.min(10, Math.max(0, score)) : null,
      mensaje_enviado: lead.mensaje_enviado ? String(lead.mensaje_enviado).trim().substring(0, 1000) : null,
      fuente: lead.fuente ? String(lead.fuente).trim().substring(0, 100) : 'import_manual',
    }
    leads.push(finalLead)
  }

  return { leadsLimpios: leads, errores, duplicados }
}
