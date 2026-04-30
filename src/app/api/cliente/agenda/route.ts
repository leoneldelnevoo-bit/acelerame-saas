import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { validarUrlAgenda, pingAgenda } from '@/lib/agenda-connectors'
import { rateLimitGuard, validateBody, auditLog } from '@/lib/security'

export async function POST(req: NextRequest) {
  // Rate limit: max 20 cambios por minuto
  const limit = await rateLimitGuard(req, 'agenda-update', 20, 60)
  if (limit) return limit

  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  // === Acción: ping link ===
  if (action === 'ping') {
    const v = validateBody(body, { url: { type: 'url', required: true } })
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
    const result = await pingAgenda((v.data as any).url)
    return NextResponse.json(result)
  }

  // === Acción default: guardar ===
  const v = validateBody<{ proveedor: string; url: string; duracion_llamada_min: number }>(body, {
    proveedor: { type: 'string', required: true, enum: ['calendly', 'cal_com', 'tidycal', 'google_calendar', 'custom'] },
    url: { type: 'url', required: true, maxLength: 500 },
    duracion_llamada_min: { type: 'number', required: true, min: 5, max: 240 },
  })
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  const { proveedor, url, duracion_llamada_min } = v.data

  // Validar formato según proveedor
  const valid = validarUrlAgenda(url)
  if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 })

  // Ping HTTP real (best-effort, no bloqueante si falla)
  const ping = await pingAgenda(url)
  const status = ping.ok ? 'ok' : 'error'

  const admin = createMasterAdminClient()

  // Upsert integraciones
  const { error: errInteg } = await admin
    .from('cliente_integraciones')
    .upsert({
      cliente_id: cliente.id,
      agenda_proveedor: proveedor,
      agenda_url: url,
      agenda_status: status,
      agenda_validado_en: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'cliente_id' })

  if (errInteg) return NextResponse.json({ error: errInteg.message }, { status: 500 })

  // Update duración en cliente_config
  await admin
    .from('cliente_config')
    .upsert({
      cliente_id: cliente.id,
      duracion_llamada_min,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'cliente_id' })

  // Audit
  await auditLog(cliente.id, 'agenda_actualizada', { proveedor, status }, req)

  return NextResponse.json({
    ok: true,
    status,
    validado_en: new Date().toISOString(),
    ping_status: ping.status,
  })
}
