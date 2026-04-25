import { redirect, notFound } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { formatNumber, formatUSD } from '@/lib/utils'
import { Copy, Clock, AlertCircle } from 'lucide-react'

export const revalidate = 0

export default async function PaqueteDetallePage({
  params,
}: {
  params: Promise<{ paquete: string }>
}) {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const { paquete: codigo } = await params
  const admin = createMasterAdminClient()

  const { data: paquete } = await admin
    .from('paquetes_credito')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle()

  if (!paquete) notFound()

  // Crear orden si no existe ya pendiente
  const { data: ordenExistente } = await admin
    .from('pagos_usdt_pendientes')
    .select('*')
    .eq('cliente_id', cliente.id)
    .eq('paquete_codigo', codigo)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let orden = ordenExistente

  if (!orden) {
    const { data: nuevaOrden } = await admin.rpc('crear_orden_pago_usdt', {
      p_cliente_id: cliente.id,
      p_paquete_codigo: codigo,
    })
    orden = Array.isArray(nuevaOrden) ? nuevaOrden[0] : nuevaOrden
  }

  const wallet = process.env.NEXT_PUBLIC_TRON_WALLET ?? 'TDzkBiQiMc8EnxWZ5f1wVBi4hSx5aRfHWy'
  const montoConCentavos = orden?.monto_usd_unico ?? paquete.precio_usd

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Pagar {paquete.nombre}</h1>
        <p className="text-fg-muted mt-1">
          {formatNumber(paquete.creditos)} créditos por {formatUSD(paquete.precio_usd)}
        </p>
      </div>

      <div className="card-gold p-8">
        <h2 className="font-serif text-xl font-bold mb-4">Instrucciones de pago</h2>

        <ol className="space-y-4 mb-6">
          <Step n={1} title="Enviá USDT a esta wallet (red TRON / TRC20)">
            <div className="bg-bg-overlay rounded-lg p-3 mt-2 font-mono text-sm break-all border border-border">
              {wallet}
            </div>
          </Step>
          <Step n={2} title={`Monto exacto: ${formatUSD(montoConCentavos)}`}>
            <p className="text-sm text-fg-muted mt-1">
              Importante: enviá el monto <strong className="text-gold">exacto</strong> (con centavos).
              Esto nos permite identificar tu pago sin que tengas que mandar el TXID.
            </p>
          </Step>
          <Step n={3} title="Esperá la confirmación">
            <p className="text-sm text-fg-muted mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Verificamos blockchain cada 3 minutos. Tus créditos se cargarán automáticamente.
            </p>
          </Step>
        </ol>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-warning">
              <p className="font-medium">No envíes desde un exchange centralizado.</p>
              <p className="text-fg-muted mt-1">
                Algunos exchanges modifican el monto exacto. Usá una wallet personal (Trust, Tronlink, etc).
              </p>
            </div>
          </div>
        </div>
      </div>

      {orden && (
        <div className="surface p-4">
          <p className="text-xs text-fg-subtle">Orden ID: <span className="font-mono">{orden.id}</span></p>
          <p className="text-xs text-fg-subtle">Expira: {new Date(orden.expires_at).toLocaleString('es-AR')}</p>
        </div>
      )}
    </div>
  )
}

function Step({ n, title, children }: any) {
  return (
    <li className="flex gap-3">
      <span className="w-7 h-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-sm font-bold shrink-0">
        {n}
      </span>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {children}
      </div>
    </li>
  )
}
