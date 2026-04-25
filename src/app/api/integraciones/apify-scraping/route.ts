import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { dispararScraping, COSTO_LEAD_ENRIQUECIDO } from '@/lib/apify/scraper'

export async function POST(req: NextRequest) {
  try {
    const cliente = await getClienteContext()
    if (!cliente) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const { sessionid, targets, limitPerTarget = 20 } = await req.json()
    if (!sessionid || !targets?.length) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const creditosRequeridos = targets.length * limitPerTarget * COSTO_LEAD_ENRIQUECIDO
    if ((cliente.saldo?.creditos_actuales ?? 0) < creditosRequeridos) {
      return NextResponse.json({
        error: `Necesitás ${creditosRequeridos} créditos. Tenés ${cliente.saldo?.creditos_actuales ?? 0}.`,
      }, { status: 400 })
    }

    const result = await dispararScraping({ sessionid, targets, limitPerTarget })
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })

    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
