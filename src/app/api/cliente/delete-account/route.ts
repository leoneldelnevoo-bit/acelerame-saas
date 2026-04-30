import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { rateLimitGuard, validateBody, auditLog } from '@/lib/security'

/**
 * POST /api/cliente/delete-account
 *
 * Soft-delete: marca cliente para eliminación.
 * Después de 30 días, un cron borra todo permanentemente.
 *
 * Body: { confirmacion: "ELIMINAR" } — frase exacta requerida
 */
export async function POST(req: NextRequest) {
  const limit = await rateLimitGuard(req, 'delete-account', 3, 3600)
  if (limit) return limit

  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const v = validateBody<{ confirmacion: string }>(body, {
    confirmacion: { type: 'string', required: true, enum: ['ELIMINAR'] },
  })
  if (!v.ok) {
    return NextResponse.json({
      error: 'Para confirmar, enviá { confirmacion: "ELIMINAR" }',
    }, { status: 400 })
  }

  if (cliente.es_founder) {
    return NextResponse.json({
      error: 'No podés eliminar la cuenta founder. Contactá a soporte.',
    }, { status: 403 })
  }

  const admin = createMasterAdminClient()

  // Soft delete: marca para eliminación en 30 días
  const fechaPurga = new Date()
  fechaPurga.setDate(fechaPurga.getDate() + 30)
  const fechaPurgaISO = fechaPurga.toISOString()

  const { error } = await admin
    .from('clientes')
    .update({
      estado: 'pendiente_eliminacion',
      motor_activo: false,
      eliminacion_solicitada_en: new Date().toISOString(),
      fecha_purga: fechaPurgaISO,
    })
    .eq('id', cliente.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Pausar cuentas IG para que no manden más DMs
  await admin
    .schema('public')
    .from('instagram_cuentas')
    .update({ estado: 'pausada' })
    .eq('cliente_id', cliente.id)

  // Pausar scraping targets
  await admin
    .schema('public')
    .from('scraping_config')
    .update({ activo: false })
    .eq('cliente_id', cliente.id)

  await auditLog(cliente.id, 'cuenta_eliminacion_solicitada', { fecha_purga: fechaPurgaISO }, req)

  return NextResponse.json({
    ok: true,
    mensaje: 'Tu cuenta fue marcada para eliminación. Tenés 30 días para reactivarla si cambiás de opinión escribiendo a soporte.',
    fecha_purga: fechaPurgaISO,
  })
}

/**
 * DELETE /api/cliente/delete-account?confirm=true
 * Eliminación INMEDIATA Y DEFINITIVA (sin esperar 30 días).
 */
export async function DELETE(req: NextRequest) {
  const limit = await rateLimitGuard(req, 'delete-account-immediate', 1, 86400)
  if (limit) return limit

  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const confirm = new URL(req.url).searchParams.get('confirm')
  if (confirm !== 'true') {
    return NextResponse.json({
      error: 'Confirmación requerida: ?confirm=true',
    }, { status: 400 })
  }

  if (cliente.es_founder) {
    return NextResponse.json({ error: 'No podés eliminar la cuenta founder.' }, { status: 403 })
  }

  const admin = createMasterAdminClient()
  const cid = cliente.id

  // Eliminar en cascada (orden inverso a dependencias)
  await admin.schema('public').from('prospeccion_mensajes').delete().eq('cliente_id', cid)
  await admin.schema('public').from('prospeccion_leads').delete().eq('cliente_id', cid)
  await admin.schema('public').from('instagram_cuentas').delete().eq('cliente_id', cid)
  await admin.schema('public').from('scraping_config').delete().eq('cliente_id', cid)
  await admin.schema('public').from('bookings').delete().eq('cliente_id', cid)
  await admin.from('cliente_config').delete().eq('cliente_id', cid)
  await admin.from('cliente_limites').delete().eq('cliente_id', cid)
  await admin.from('cliente_integraciones').delete().eq('cliente_id', cid)
  await admin.from('creditos_consumo').delete().eq('cliente_id', cid)
  await admin.from('creditos_compras').delete().eq('cliente_id', cid)
  await admin.from('creditos_movimientos').delete().eq('cliente_id', cid)
  await admin.from('creditos_saldo').delete().eq('cliente_id', cid)
  await admin.from('pagos_usdt_pendientes').delete().eq('cliente_id', cid)
  await admin.from('leads_imports').delete().eq('cliente_id', cid)

  const { error } = await admin.from('clientes').delete().eq('id', cid)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    mensaje: 'Cuenta eliminada permanentemente. Toda tu data fue purgada.',
  })
}
