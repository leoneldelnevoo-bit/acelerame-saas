import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { rateLimitGuard } from '@/lib/security'
import { parseCSV, parseExcel, parseJSON, parseGoogleSheet, parseSupabase, detectarMapeo, aplicarMapeo } from '@/lib/lead-parser'

/**
 * POST /api/cliente/import/preview
 * Body: FormData con file Y/O JSON con {tipo, ...config}
 *
 * Responde con preview ANTES de importar realmente.
 */
export async function POST(req: NextRequest) {
  const limit = await rateLimitGuard(req, 'import-preview', 30, 60)
  if (limit) return limit

  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''
  let columnas: string[] = []
  let filas: Record<string, any>[] = []

  try {
    if (contentType.includes('multipart/form-data')) {
      // === Upload de archivo ===
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 })

      // Tamaño máximo 10MB
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Archivo muy grande (máx 10MB)' }, { status: 400 })
      }

      const filename = file.name.toLowerCase()
      if (filename.endsWith('.csv') || filename.endsWith('.tsv') || filename.endsWith('.txt')) {
        const text = await file.text()
        const parsed = parseCSV(text)
        columnas = parsed.columnas
        filas = parsed.filas
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        const buffer = await file.arrayBuffer()
        const parsed = parseExcel(buffer)
        columnas = parsed.columnas
        filas = parsed.filas
      } else if (filename.endsWith('.json')) {
        const text = await file.text()
        const parsed = parseJSON(text)
        columnas = parsed.columnas
        filas = parsed.filas
      } else {
        return NextResponse.json(
          { error: 'Formato no soportado. Usá CSV, XLSX, XLS o JSON.' },
          { status: 400 }
        )
      }
    } else {
      // === JSON con config remota ===
      const body = await req.json().catch(() => null)
      if (!body || !body.tipo) {
        return NextResponse.json({ error: 'Falta tipo (sheets, supabase)' }, { status: 400 })
      }

      if (body.tipo === 'sheets') {
        const parsed = await parseGoogleSheet(body.url)
        columnas = parsed.columnas
        filas = parsed.filas
      } else if (body.tipo === 'supabase') {
        const parsed = await parseSupabase({
          url: body.url,
          anonKey: body.anonKey,
          tabla: body.tabla,
        })
        columnas = parsed.columnas
        filas = parsed.filas
      } else {
        return NextResponse.json({ error: 'Tipo desconocido' }, { status: 400 })
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error parseando archivo' }, { status: 400 })
  }

  if (columnas.length === 0 || filas.length === 0) {
    return NextResponse.json({ error: 'Archivo vacío o sin columnas' }, { status: 400 })
  }

  // Limitar a 5000 filas
  if (filas.length > 5000) {
    return NextResponse.json(
      { error: `Demasiadas filas (${filas.length}). Máximo 5000 por import. Dividilo en archivos más chicos.` },
      { status: 400 }
    )
  }

  // Auto-detectar mapeo
  const { mapeo, ambiguas } = detectarMapeo(columnas)

  // Si no detectó handle, error temprano (es lo único obligatorio)
  if (!Object.values(mapeo).includes('handle')) {
    return NextResponse.json({
      error: 'No pude detectar la columna del @handle. Renombrá la columna a "handle", "username", "instagram" o similar.',
      columnasDisponibles: columnas,
    }, { status: 400 })
  }

  // Aplicar mapeo a primeras 10 para preview
  const muestra = filas.slice(0, 10)
  const { leadsLimpios, errores, duplicados } = aplicarMapeo(filas, mapeo)

  return NextResponse.json({
    total: filas.length,
    validos: leadsLimpios.length,
    duplicados,
    erroresCount: errores.length,
    erroresPreview: errores.slice(0, 5),
    columnasOriginales: columnas,
    mapeo, // {colOrig: campo}
    ambiguas,
    primerasFilas: leadsLimpios.slice(0, 10),
  })
}
