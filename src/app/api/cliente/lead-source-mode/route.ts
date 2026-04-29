import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mode } = await req.json()
  if (!['scraping_auto', 'byol', 'mixed'].includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  const admin = createMasterAdminClient()
  const { error } = await admin
    .from('clientes')
    .update({ lead_source_mode: mode })
    .eq('id', cliente.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, mode })
}
