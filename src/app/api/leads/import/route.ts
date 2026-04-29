import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { csv, source_type = 'csv', filename } = await req.json()
  if (!csv?.trim()) return NextResponse.json({ error: 'CSV vacío' }, { status: 400 })

  const admin = createMasterAdminClient()

  // Crear registro de import
  const { data: importRec, error: impErr } = await admin
    .from('leads_imports')
    .insert({
      cliente_id: cliente.id,
      source_type,
      filename: filename || null,
      status: 'processing',
    })
    .select()
    .single()

  if (impErr) return NextResponse.json({ error: impErr.message }, { status: 500 })

  // Parsear CSV
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) {
    await admin.from('leads_imports').update({ status: 'failed', error_log: 'CSV vacío' }).eq('id', importRec.id)
    return NextResponse.json({ error: 'CSV sin filas de datos' }, { status: 400 })
  }

  const header = lines[0].split(',').map((h: string) => h.trim().toLowerCase())
  const handleIdx = header.indexOf('handle')
  if (handleIdx === -1) {
    await admin.from('leads_imports').update({ status: 'failed', error_log: 'Falta columna handle' }).eq('id', importRec.id)
    return NextResponse.json({ error: 'CSV debe tener columna "handle"' }, { status: 400 })
  }

  const nombreIdx = header.indexOf('nombre')
  const bioIdx = header.indexOf('bio')
  const scoreIdx = header.indexOf('score')
  const mensajeIdx = header.indexOf('mensaje_enviado')
  const emailIdx = header.indexOf('email')
  const telefonoIdx = header.indexOf('telefono')

  const leads: any[] = []
  const errores: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const handle = (cols[handleIdx] || '').trim().replace('@', '').toLowerCase()
    if (!handle) {
      errores.push(`Fila ${i + 1}: handle vacío`)
      continue
    }
    leads.push({
      cliente_id: cliente.id,
      handle,
      nombre: nombreIdx >= 0 ? cols[nombreIdx] || null : null,
      bio: bioIdx >= 0 ? cols[bioIdx] || null : null,
      score: scoreIdx >= 0 ? parseInt(cols[scoreIdx]) || 7 : 7,
      mensaje_enviado: mensajeIdx >= 0 ? cols[mensajeIdx] || null : null,
      email: emailIdx >= 0 ? cols[emailIdx] || null : null,
      telefono: telefonoIdx >= 0 ? cols[telefonoIdx] || null : null,
      plataforma: 'instagram',
      estado: 'nuevo',
      etapa: 0,
      fuente: 'byol_import',
    })
  }

  // Insertar leads (ignore duplicates por handle único global)
  let procesados = 0
  let fallados = errores.length
  if (leads.length > 0) {
    const { data: inserted, error: insErr } = await admin
      .schema('public')
      .from('prospeccion_leads')
      .upsert(leads, { onConflict: 'handle', ignoreDuplicates: true })
      .select('id')

    if (insErr) {
      // Si es error global, marcamos todo como fallado
      fallados += leads.length
      errores.push(`DB error: ${insErr.message}`)
    } else {
      procesados = inserted?.length || 0
      fallados += leads.length - procesados
    }
  }

  // Actualizar registro de import
  const finalStatus = fallados === 0 ? 'completed' : procesados > 0 ? 'partial' : 'failed'
  await admin
    .from('leads_imports')
    .update({
      total_filas: lines.length - 1,
      procesados,
      fallados,
      status: finalStatus,
      error_log: errores.length > 0 ? errores.slice(0, 20).join('\n') : null,
    })
    .eq('id', importRec.id)

  return NextResponse.json({
    ok: true,
    procesados,
    fallados,
    import_id: importRec.id,
    status: finalStatus,
  })
}

// Parsear una línea CSV simple (maneja comas dentro de comillas)
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"' && line[i + 1] === '"') {
      current += '"'
      i++
    } else if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result.map((s) => s.trim())
}
