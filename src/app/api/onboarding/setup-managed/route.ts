import { NextRequest, NextResponse } from 'next/server'
import { createMasterAdminClient, createMasterServerClient } from '@/lib/supabase/server'
import { setupClienteManaged } from '@/lib/onboarding/setup-managed'
import { slugify } from '@/lib/utils'

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

    // Verificar que no exista ya
    const { data: existente } = await admin.from('clientes').select('id').eq('email', email).maybeSingle()
    if (existente) {
      return NextResponse.json({ ok: true, id: existente.id, existed: true })
    }

    // Crear cliente
    const { data: cliente, error } = await admin.from('clientes').insert({
      email,
      nombre_completo,
      empresa: empresa || null,
      slug,
      estado: 'trial',
      es_founder: false,
      motor_activo: false,
      db_modalidad: null, // se elige en wizard
      schema_db: 'public',
      onboarding_completado: false,
      onboarding_paso: 1,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Crear saldo inicial (0 créditos)
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
 * PUT: marca onboarding como completo + crea schema si modalidad=managed
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createMasterServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const body = await req.json()
    const { db_modalidad, nicho, completar } = body

    const admin = createMasterAdminClient()
    const { data: cliente } = await admin.from('clientes').select('*').eq('email', user.email).maybeSingle()
    if (!cliente) return NextResponse.json({ error: 'No cliente' }, { status: 404 })

    // Si está pidiendo crear schema managed
    if (db_modalidad === 'managed') {
      const result = await setupClienteManaged(cliente.id, cliente.slug)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    }

    // Actualizar
    const updates: any = {}
    if (db_modalidad) updates.db_modalidad = db_modalidad
    if (nicho) updates.nicho = nicho
    if (completar) {
      updates.onboarding_completado = true
      updates.onboarding_paso = 8
    }

    if (Object.keys(updates).length > 0) {
      await admin.from('clientes').update(updates).eq('id', cliente.id)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
