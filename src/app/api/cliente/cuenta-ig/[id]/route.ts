import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createMasterAdminClient()

  // Validar ownership
  const { data: cuenta } = await admin
    .schema('public')
    .from('instagram_cuentas')
    .select('cliente_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!cuenta || cuenta.cliente_id !== cliente.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Whitelist de campos editables
  const update: any = {}
  if ('estado' in body) update.estado = body.estado
  if ('score_min' in body) update.score_min = body.score_min
  if ('score_max' in body) update.score_max = body.score_max

  const { error } = await admin
    .schema('public')
    .from('instagram_cuentas')
    .update(update)
    .eq('id', params.id)
    .eq('cliente_id', cliente.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createMasterAdminClient()
  const { error } = await admin
    .schema('public')
    .from('instagram_cuentas')
    .delete()
    .eq('id', params.id)
    .eq('cliente_id', cliente.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
