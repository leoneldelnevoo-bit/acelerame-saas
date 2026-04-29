import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, sessionid, tipo, score_min, score_max } = await req.json()

  if (!username?.trim() || !sessionid?.trim()) {
    return NextResponse.json({ error: 'Username y sessionid son obligatorios' }, { status: 400 })
  }
  if (!['principal', 'scraping'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const admin = createMasterAdminClient()
  const { error } = await admin
    .schema('public')
    .from('instagram_cuentas')
    .insert({
      cliente_id: cliente.id,
      username: username.trim(),
      sessionid: sessionid.trim(),
      tipo,
      estado: 'activa',
      score_min: tipo === 'principal' ? (score_min ?? 7) : null,
      score_max: tipo === 'principal' ? (score_max ?? 10) : null,
      dms_hoy: 0,
    })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese username' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
