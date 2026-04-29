import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

const CAMPOS_POR_SECCION: Record<string, string[]> = {
  producto: ['producto_nombre', 'producto_descripcion', 'producto_propuesta_valor', 'producto_precio_rango'],
  audiencia: ['buyer_persona_descripcion', 'buyer_persona_nicho', 'buyer_persona_dolor_principal', 'buyer_persona_objeciones_comunes', 'calificacion_criterio', 'descalificacion_criterio'],
  voz: ['tono', 'idioma', 'region', 'palabras_prohibidas', 'ejemplos_mensajes'],
  agenda: ['link_agenda', 'duracion_llamada_min'],
}

export async function POST(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { section, data } = await req.json()

  if (!section || !CAMPOS_POR_SECCION[section]) {
    return NextResponse.json({ error: 'Sección inválida' }, { status: 400 })
  }

  // Whitelist: solo guardar campos permitidos para esta sección
  const camposPermitidos = CAMPOS_POR_SECCION[section]
  const update: any = {}
  for (const campo of camposPermitidos) {
    if (campo in data) update[campo] = data[campo]
  }
  update.updated_at = new Date().toISOString()

  const admin = createMasterAdminClient()
  const { error } = await admin
    .from('cliente_config')
    .upsert({ cliente_id: cliente.id, ...update }, { onConflict: 'cliente_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, section })
}
