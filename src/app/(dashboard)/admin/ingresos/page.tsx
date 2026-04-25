import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { formatUSD, formatNumber, timeAgo } from '@/lib/utils'
import { DollarSign, TrendingUp, Clock } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Admin · Ingresos' }

export default async function AdminIngresosPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')
  if (cliente.email !== 'leoneldelnevoo@gmail.com') redirect('/dashboard')

  const admin = createMasterAdminClient()
  const { data: compras } = await admin
    .from('creditos_compras')
    .select('*, clientes(email,nombre_completo)')
    .eq('estado', 'confirmado')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: pendientes } = await admin
    .from('pagos_usdt_pendientes')
    .select('*, clientes(email,nombre_completo)')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  const totalConfirmado = (compras ?? []).reduce((acc: number, c: any) => acc + parseFloat(c.precio_usd ?? 0), 0)
  const totalPendiente = (pendientes ?? []).reduce((acc: number, p: any) => acc + parseFloat(p.monto_usd_unico ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Ingresos</h1>
        <p className="text-fg-muted mt-1">Pagos confirmados y pendientes</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-gold p-5">
          <p className="text-xs text-fg-subtle uppercase tracking-wider mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Total confirmado
          </p>
          <p className="font-serif text-3xl font-bold text-gold">{formatUSD(totalConfirmado)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs text-fg-subtle uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" /> Pendiente verificación
          </p>
          <p className="font-serif text-3xl font-bold">{formatUSD(totalPendiente)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs text-fg-subtle uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" /> Compras totales
          </p>
          <p className="font-serif text-3xl font-bold">{(compras ?? []).length}</p>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-serif text-xl font-bold">Pagos pendientes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-bg-overlay">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">Cliente</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Paquete</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Monto</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Creado</th>
            </tr>
          </thead>
          <tbody>
            {(pendientes ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-fg-subtle">Sin pagos pendientes</td></tr>
            )}
            {(pendientes ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="px-4 py-3">{p.clientes?.email ?? '—'}</td>
                <td className="px-4 py-3">{p.paquete_codigo}</td>
                <td className="px-4 py-3 font-mono text-warning">{formatUSD(p.monto_usd_unico)}</td>
                <td className="px-4 py-3 text-xs text-fg-subtle">{timeAgo(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-serif text-xl font-bold">Compras confirmadas</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-bg-overlay">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">Cliente</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Paquete</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Créditos</th>
              <th className="px-4 py-3 font-medium text-fg-muted">USD</th>
              <th className="px-4 py-3 font-medium text-fg-muted">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {(compras ?? []).map((c: any) => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="px-4 py-3">{c.clientes?.email ?? '—'}</td>
                <td className="px-4 py-3">{c.paquete_nombre ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-success">+{formatNumber(c.creditos)}</td>
                <td className="px-4 py-3 font-mono">{formatUSD(c.precio_usd)}</td>
                <td className="px-4 py-3 text-xs text-fg-subtle">{timeAgo(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
