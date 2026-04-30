import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/cliente/audit-log?limit=100
 *
 * El cliente puede ver TODOS los accesos a su cuenta.
 * Esto es transparencia: si vos (admin) entrás a su data,
 * va a quedar un registro que el cliente puede consultar.
 */
export async function GET(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') ?? '100'), 500)
  const offset = parseInt(new URL(req.url).searchParams.get('offset') ?? '0')

  const admin = createMasterAdminClient()
  const { data, count, error } = await admin
    .from('audit_log')
    .select('id, accion, recurso, detalles, ip_address, fecha', { count: 'exact' })
    .eq('cliente_id', cliente.id)
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    total: count ?? 0,
    entries: data ?? [],
  })
}
