import { NextRequest, NextResponse } from 'next/server'
import { createMasterAdminClient, createMasterServerClient } from '@/lib/supabase/server'
import { slugify, clienteSchemaName } from '@/lib/utils'

/**
 * POST: crea registro en master.clientes después del signup
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre_completo, empresa, slug: slugRaw } = body

    if (!email || !nombre_completo) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const admin = createMasterAdminClient()
    const slug = slugRaw || slugify(empresa || nombre_completo)

    const { data: existente } = await admin.from('clientes').select('id').eq('email', email).maybeSingle()
    if (existente) {
      return NextResponse.json({ ok: true, id: existente.id, existed: true })
    }

    const { data: cliente, error } = await admin.from('clientes').insert({
      email,
      nombre_completo,
      empresa: empresa || null,
      slug,
      estado: 'trial',
      es_founder: false,
      rol: 'cliente',
      motor_activo: false,
      db_modalidad: null,
      schema_db: 'public',
      onboarding_completado: false,
      onboarding_paso: 1,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin.from('creditos_saldo').insert({
      cliente_id: cliente.id,
      creditos_actuales: 0,
      creditos_comprados_total: 0,
      creditos_gastados_total: 0,
    })

    return NextResponse.json({ ok: true, id: cliente.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}

/**
 * PUT: marca db_modalidad + crea schema si modalidad=managed
 * Body: { db_modalidad?: 'managed' | 'byodb', nicho?: string, completar?: boolean }
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createMasterServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const body = await req.json()
    const { db_modalidad, nicho, completar } = body

    const admin = createMasterAdminClient()
    const { data: cliente, error: errFetch } = await admin.from('clientes').select('id, slug, db_modalidad, schema_db').eq('email', user.email).maybeSingle()
    if (errFetch || !cliente) return NextResponse.json({ error: 'No cliente' }, { status: 404 })

    // Si pidió Managed: crear schema (idempotente)
    if (db_modalidad === 'managed') {
      const schemaName = clienteSchemaName(cliente.slug)
      const { data: rpcData, error: rpcErr } = await admin.rpc('crear_schema_cliente', {
        p_cliente_id: cliente.id,
        p_schema_name: schemaName,
      })
      if (rpcErr) {
        return NextResponse.json({ error: 'Error creando schema: ' + rpcErr.message }, { status: 500 })
      }
      if (rpcData && !rpcData.ok) {
        return NextResponse.json({ error: rpcData.error || 'Error creando schema' }, { status: 500 })
      }
      // crear_schema_cliente ya hace el UPDATE de master.clientes, así que no necesito hacerlo acá
    }

    // Updates manuales (nicho, completar, byodb sin schema)
    const updates: any = {}
    if (db_modalidad === 'byodb') {
      updates.db_modalidad = 'byodb'
      updates.schema_db = 'public'
    }
    if (nicho) updates.nicho = nicho
    if (completar) {
      updates.onboarding_completado = true
      updates.onboarding_paso = 8
    }

    if (Object.keys(updates).length > 0) {
      await admin.from('clientes').update(updates).eq('id', cliente.id)
    }

    // Devolver el estado nuevo
    const { data: clienteActualizado } = await admin.from('clientes')
      .select('id, slug, db_modalidad, schema_db, supabase_test_status, onboarding_completado')
      .eq('id', cliente.id).single()

    return NextResponse.json({ ok: true, cliente: clienteActualizado })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
