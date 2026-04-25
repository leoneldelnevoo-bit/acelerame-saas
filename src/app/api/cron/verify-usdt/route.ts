import { NextRequest, NextResponse } from 'next/server'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { obtenerTransaccionesUSDT } from '@/lib/tron/client'

export async function GET(req: NextRequest) {
  // Auth via cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createMasterAdminClient()

  // Expirar órdenes viejas
  await admin.rpc('expirar_ordenes_viejas')

  // Obtener TXs USDT recibidas en última hora
  const txs = await obtenerTransaccionesUSDT(60)

  // Obtener órdenes pendientes
  const { data: pendientes } = await admin
    .from('pagos_usdt_pendientes')
    .select('*')
    .eq('estado', 'pendiente')

  let confirmadas = 0

  for (const orden of (pendientes ?? [])) {
    const match = txs.find((tx: any) => Math.abs(tx.amount_usd - orden.monto_usd_unico) < 0.001)
    if (match) {
      const { error } = await admin.rpc('confirmar_pago_usdt', {
        p_orden_id: orden.id,
        p_txid: match.txid,
      })
      if (!error) confirmadas++
    }
  }

  return NextResponse.json({ ok: true, txs: txs.length, pendientes: (pendientes ?? []).length, confirmadas })
}
