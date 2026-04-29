import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createMasterAdminClient()

  // Solo updateamos columnas válidas (whitelist)
  const allowed = [
    'max_dms_por_dia', 'max_followups_por_dia', 'max_replies_por_ciclo',
    'max_acciones_por_hora', 'hora_inicio', 'hora_fin', 'zona_horaria',
    'cooldown_entre_dms_seg', 'cooldown_followup_horas', 'score_minimo',
    'max_objeciones_antes_descartar', 'scraping_intervalo_horas', 'scraping_max_perfiles_dia',
  ]
  const update: any = {}
  for (const k of allowed) {
    if (k in body) update[k] = body[k]
  }
  update.updated_at = new Date().toISOString()

  const { error } = await admin
    .from('cliente_limites')
    .upsert({ cliente_id: cliente.id, ...update }, { onConflict: 'cliente_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
