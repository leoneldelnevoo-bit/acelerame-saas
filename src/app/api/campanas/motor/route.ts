import { NextRequest, NextResponse } from 'next/server'
import { createMasterServerClient, createMasterAdminClient } from '@/lib/supabase/server'
import { getClienteContext, clienteTieneDB } from '@/lib/cliente-db'

export async function POST(req: NextRequest) {
  try {
    const cliente = await getClienteContext()
    if (!cliente) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const body = await req.json()
    const activar = !!body.activo

    if (activar) {
      // Validaciones para activar
      if (!clienteTieneDB(cliente)) {
        return NextResponse.json({ error: 'Configurá tu base de datos antes de activar' }, { status: 400 })
      }
      if ((cliente.saldo?.creditos_actuales ?? 0) <= 0) {
        return NextResponse.json({ error: 'Cargá créditos antes de activar' }, { status: 400 })
      }
    }

    const admin = createMasterAdminClient()
    const { error } = await admin
      .from('clientes')
      .update({ motor_activo: activar })
      .eq('id', cliente.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, motor_activo: activar })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
