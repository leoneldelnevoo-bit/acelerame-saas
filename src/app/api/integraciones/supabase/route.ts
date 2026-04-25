import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const cliente = await getClienteContext()
    if (!cliente) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const { url, anon_key } = await req.json()
    if (!url || !anon_key) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

    // Test connection
    try {
      const test = createClient(url, anon_key)
      const { error } = await test.from('prospeccion_leads').select('handle').limit(1)
      if (error && !error.message.includes('does not exist')) throw error
    } catch (e: any) {
      return NextResponse.json({ error: 'No pude conectar: ' + (e?.message ?? 'unknown') }, { status: 400 })
    }

    const admin = createMasterAdminClient()
    await admin.from('clientes').update({
      db_modalidad: 'byodb',
      supabase_url: url,
      supabase_anon_key: anon_key,
      schema_db: 'public',
      supabase_test_status: 'ok',
      supabase_test_at: new Date().toISOString(),
    }).eq('id', cliente.id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cliente = await getClienteContext()
    if (!cliente) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const admin = createMasterAdminClient()
    await admin.from('clientes').update({
      supabase_url: null,
      supabase_anon_key: null,
      supabase_test_status: null,
    }).eq('id', cliente.id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
