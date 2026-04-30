import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { rateLimitGuard, validateBody, auditLog } from '@/lib/security'
import { parseCSV, parseExcel, parseJSON, parseGoogleSheet, parseSupabase, aplicarMapeo } from '@/lib/lead-parser'

/**
 * POST /api/cliente/import/process
 * Body: FormData con archivo + mapeo confirmado por el usuario, O JSON con config remota.
 * Inserta en public.prospeccion_leads con cliente_id y registra el import en master.leads_imports.
 */
export async function POST(req: NextRequest) {
  const limit = await rateLimitGuard(req, 'import-process', 5, 60)
  if (limit) return limit

  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''
  let columnas: string[] = []
  let filas: Record<string, any>[] = []
  let mapeo: Record<string, string> = {}
  let sourceType = 'csv'
  let filename = 'import.csv'

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const mapeoRaw = formData.get('mapeo') as string | null

      if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 })
      if (!mapeoRaw) return NextResponse.json({ error: 'Falta mapeo' }, { status: 400 })

      try {
        mapeo = JSON.parse(mapeoRaw)
      } catch {
        return NextResponse.json({ error: 'Mapeo inválido' }, { status: 400 })
      }

      filename = file.name
      const fname = filename.toLowerCase()
      if (fname.endsWith('.csv') || fname.endsWith('.tsv')) {
        sourceType = 'csv'
        const parsed = parseCSV(await file.text())
        columnas = parsed.columnas; filas = parsed.filas
      } else if (fname.endsWith('.xlsx') || fname.endsWith('.xls')) {
        sourceType = 'excel'
        const parsed = parseExcel(await file.arrayBuffer())
        columnas = parsed.columnas; filas = parsed.filas
      } else if (fname.endsWith('.json')) {
        sourceType = 'json'
        const parsed = parseJSON(await file.text())
        columnas = parsed.columnas; filas = parsed.filas
      } else {
        return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })
      }
    } else {
      const body = await req.json().catch(() => null)
      if (!body || !body.tipo || !body.mapeo) {
        return NextResponse.json({ error: 'Falta tipo o mapeo' }, { status: 400 })
      }
      mapeo = body.mapeo

      if (body.tipo === 'sheets') {
        sourceType = 'sheets'
        filename = body.url
        const parsed = await parseGoogleSheet(body.url)
        columnas = parsed.columnas; filas = parsed.filas
      } else if (body.tipo === 'supabase') {
        sourceType = 'supabase'
        filename = `${body.url}/${body.tabla}`
        const parsed = await parseSupabase({ url: body.url, anonKey: body.anonKey, tabla: body.tabla })
        columnas = parsed.columnas; filas = parsed.filas
      } else {
        return NextResponse.json({ error: 'Tipo desconocido' }, { status: 400 })
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error parseando' }, { status: 400 })
  }

  if (filas.length === 0) {
    return NextResponse.json({ error: 'No hay filas para importar' }, { status: 400 })
  }

  // Aplicar mapeo final
  const { leadsLimpios, errores, duplicados } = aplicarMapeo(filas, mapeo)
  if (leadsLimpios.length === 0) {
    return NextResponse.json({ error: 'No hay leads válidos para importar' }, { status: 400 })
  }

  // Insertar en DB
  const admin = createMasterAdminClient()

  // 1) Crear registro en master.leads_imports
  const { data: importRow, error: errImport } = await admin
    .from('leads_imports')
    .insert({
      cliente_id: cliente.id,
      source_type: sourceType,
      filename: filename.substring(0, 200),
      total_filas: filas.length,
      procesados: 0,
      fallados: errores.length,
      status: 'procesando',
      metadata: { mapeo, duplicados, columnas_originales: columnas },
    })
    .select('id')
    .single()

  if (errImport) {
    return NextResponse.json({ error: errImport.message }, { status: 500 })
  }

  // 2) Insertar leads en public.prospeccion_leads (en chunks de 500)
  const CHUNK = 500
  let procesados = 0
  let fallaron = 0
  const errorMessages: string[] = []

  for (let i = 0; i < leadsLimpios.length; i += CHUNK) {
    const chunk = leadsLimpios.slice(i, i + CHUNK).map((lead) => ({
      cliente_id: cliente.id,
      handle: lead.handle,
      nombre: lead.nombre,
      bio: lead.bio,
      email: lead.email,
      telefono: lead.telefono,
      score: lead.score ?? 7, // default 7 si no viene
      score_motivo: lead.score == null ? 'Importado manualmente' : null,
      mensaje_enviado: lead.mensaje_enviado,
      fuente: lead.fuente || 'import_manual',
      plataforma: 'instagram',
      estado: 'nuevo',
      etapa: 0,
    }))

    const { error: errInsert } = await admin
      .schema('public')
      .from('prospeccion_leads')
      .upsert(chunk, { onConflict: 'cliente_id,handle', ignoreDuplicates: true })

    if (errInsert) {
      fallaron += chunk.length
      errorMessages.push(`Chunk ${i}: ${errInsert.message}`)
    } else {
      procesados += chunk.length
    }
  }

  // 3) Actualizar registro de import
  await admin
    .from('leads_imports')
    .update({
      procesados,
      fallados: fallaron + errores.length,
      status: errorMessages.length > 0 ? 'parcial' : 'completado',
      error_log: errorMessages.length > 0 ? errorMessages.join('\n') : null,
    })
    .eq('id', importRow.id)

  await auditLog(cliente.id, 'leads_importados', { procesados, source: sourceType, total: filas.length }, req)

  return NextResponse.json({
    ok: true,
    importado: procesados,
    duplicados_omitidos: duplicados,
    errores: errores.length,
    fallados: fallaron,
    import_id: importRow.id,
  })
}
