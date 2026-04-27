import { NextRequest, NextResponse } from 'next/server'
import { createMasterAdminClient, createMasterServerClient } from '@/lib/supabase/server'

/**
 * GET: trae config actual del cliente
 */
export async function GET() {
  try {
    const supabase = await createMasterServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const admin = createMasterAdminClient()
    const { data: cliente } = await admin
      .from('clientes')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!cliente) return NextResponse.json({ error: 'No cliente' }, { status: 404 })

    const { data: config } = await admin
      .from('cliente_config')
      .select('*')
      .eq('cliente_id', cliente.id)
      .maybeSingle()

    return NextResponse.json({ ok: true, config })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}

/**
 * PUT: actualiza/crea config del cliente (upsert)
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createMasterServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const body = await req.json()

    const admin = createMasterAdminClient()
    const { data: cliente } = await admin
      .from('clientes')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!cliente) return NextResponse.json({ error: 'No cliente' }, { status: 404 })

    // Sanitización: solo aceptamos campos conocidos
    const camposPermitidos = [
      'producto_nombre',
      'producto_descripcion',
      'producto_propuesta_valor',
      'producto_precio_rango',
      'buyer_persona_descripcion',
      'buyer_persona_nicho',
      'buyer_persona_dolor_principal',
      'buyer_persona_objeciones_comunes',
      'tono',
      'idioma',
      'region',
      'palabras_prohibidas',
      'ejemplos_mensajes',
      'calificacion_criterio',
      'descalificacion_criterio',
      'link_agenda',
      'duracion_llamada_min',
    ] as const

    const payload: Record<string, any> = { cliente_id: cliente.id }
    for (const campo of camposPermitidos) {
      if (campo in body) payload[campo] = body[campo]
    }

    // Upsert: si existe, actualiza; si no, crea
    const { error } = await admin
      .from('cliente_config')
      .upsert(payload, { onConflict: 'cliente_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
