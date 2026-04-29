import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createMasterAdminClient()

  // VALIDAR que el target sea de este cliente
  const { data: target } = await admin
    .schema('public')
    .from('scraping_config')
    .select('cliente_id')
    .eq('id', params.id)
    .single()

  if (!target || target.cliente_id !== cliente.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .schema('public')
    .from('scraping_config')
    .update({ activo: body.activo })
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
    .from('scraping_config')
    .delete()
    .eq('id', params.id)
    .eq('cliente_id', cliente.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
