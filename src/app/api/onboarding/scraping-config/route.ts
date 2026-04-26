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

    const { tipo, valores, limit_per_target = 20 } = await req.json()
    if (!tipo || !valores?.length) {
      return NextResponse.json({ error: 'Faltan datos (tipo, valores)' }, { status: 400 })
    }
    const tiposValidos = ['hashtag', 'cuenta_comentarios', 'cuenta_seguidores', 'keyword']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
    }

    const filas = valores.map((v: string) => ({
      tipo,
      valor: v.trim(),
      limit_per_target,
    }))

    if (cliente.db_modalidad === 'byodb') {
      const db = createClienteSupabase(cliente)
      if (!db) return NextResponse.json({ error: 'No DB' }, { status: 500 })
      const { error } = await db.from('scraping_config').insert(filas.map((f: any) => ({ ...f, activo: true })))
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, count: filas.length })
    }

    // Managed: RPC
    const admin = createMasterAdminClient()
    const { data, error } = await admin.rpc('insertar_scraping_config', {
      p_schema: cliente.schema_db,
      p_filas: filas,
    })
    if (error || !data?.ok) {
      return NextResponse.json({ error: data?.error || error?.message || 'Error' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, count: data.count })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
