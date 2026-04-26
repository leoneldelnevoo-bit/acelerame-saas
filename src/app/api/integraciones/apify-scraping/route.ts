import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext, clienteTieneDB } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { dispararScraping, COSTO_LEAD_ENRIQUECIDO } from '@/lib/apify/scraper'

export async function POST(req: NextRequest) {
  try {
    const cliente = await getClienteContext()
    if (!cliente) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    if (!clienteTieneDB(cliente)) {
      return NextResponse.json({ error: 'Configurá la base de datos primero' }, { status: 400 })
    }

    const { sessionid, targets, limitPerTarget = 20 } = await req.json()
    if (!sessionid || !targets?.length) {
      return NextResponse.json({ error: 'Faltan datos (sessionid, targets)' }, { status: 400 })
    }

    // Validar créditos suficientes
    const creditosRequeridos = targets.length * limitPerTarget * COSTO_LEAD_ENRIQUECIDO
    const saldoActual = cliente.saldo?.creditos_actuales ?? 0
    if (saldoActual < creditosRequeridos) {
      return NextResponse.json({
        error: `Necesitás ${creditosRequeridos} créditos. Tenés ${saldoActual}.`,
        creditos_requeridos: creditosRequeridos,
        creditos_actuales: saldoActual,
      }, { status: 400 })
    }

    // Disparar scraping en Apify
    const result = await dispararScraping({ sessionid, targets, limitPerTarget })
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Registrar el run en la DB del cliente para que el motor n8n lo procese
    // (El motor n8n se encarga de leer el dataset Apify y guardarlo en prospeccion_leads)
    const admin = createMasterAdminClient()

    // Log evento de scraping disparado (en master)
    try {
      await admin.from('eventos_clientes').insert({
        cliente_id: cliente.id,
        tipo: 'apify_scraping_disparado',
        payload: {
          run_id: result.runId,
          dataset_id: result.datasetId,
          targets: targets.length,
          schema_db: cliente.schema_db,
        },
      })
    } catch {
      // Si la tabla no existe o falla, no rompemos el flow
    }

    return NextResponse.json({
      ok: true,
      run_id: result.runId,
      dataset_id: result.datasetId,
      mensaje: 'Scraping disparado. Los leads van a aparecer en tu dashboard cuando termine.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
