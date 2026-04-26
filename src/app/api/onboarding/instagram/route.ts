import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext, createClienteSupabase, clienteTieneDB } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const cliente = await getClienteContext()
    if (!cliente) return NextResponse.json({ error: 'No auth' }, { status: 401 })
    if (!clienteTieneDB(cliente)) {
      return NextResponse.json({ error: 'Configurá la base de datos primero' }, { status: 400 })
    }

    const { username, sessionid } = await req.json()
    if (!username || !sessionid) {
      return NextResponse.json({ error: 'Faltan datos (username, sessionid)' }, { status: 400 })
    }

    // BYODB: insert directo
    if (cliente.db_modalidad === 'byodb') {
      const db = createClienteSupabase(cliente)
      if (!db) return NextResponse.json({ error: 'No DB' }, { status: 500 })

      const { error } = await db.from('instagram_cuentas').upsert({
        username,
        sessionid,
        estado: 'activa',
        cliente_id: cliente.id,
      }, { onConflict: 'username' })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    // Managed: RPC
    const admin = createMasterAdminClient()
    const { data, error } = await admin.rpc('insertar_cuenta_ig', {
      p_schema: cliente.schema_db,
      p_username: username,
      p_sessionid: sessionid,
      p_cliente_id: cliente.id,
    })
    if (error || !data?.ok) {
      return NextResponse.json({ error: data?.error || error?.message || 'Error inserting' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
