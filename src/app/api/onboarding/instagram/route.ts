import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext, createClienteSupabase, clienteTieneDB } from '@/lib/cliente-db'

export async function POST(req: NextRequest) {
  try {
    const cliente = await getClienteContext()
    if (!cliente) return NextResponse.json({ error: 'No auth' }, { status: 401 })
    if (!clienteTieneDB(cliente)) {
      return NextResponse.json({ error: 'Configurá la base de datos primero' }, { status: 400 })
    }

    const { handle, sessionid } = await req.json()
    if (!handle || !sessionid) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    const db = createClienteSupabase(cliente)
    if (!db) return NextResponse.json({ error: 'No DB' }, { status: 500 })

    const { error } = await db.from('instagram_cuentas').upsert({
      handle,
      sessionid,
      activo: true,
      cliente_id: cliente.id,
    }, { onConflict: 'handle' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
