import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { formatNumber, timeAgo } from '@/lib/utils'
import { CreditCard, Plus, TrendingDown, TrendingUp } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Créditos · ACELERAME' }

export default async function CreditosPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const [{ data: consumos }, { data: compras }] = await Promise.all([
    admin.from('creditos_consumo').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false }).limit(50),
    admin.from('creditos_compras').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Créditos</h1>
          <p className="text-fg-muted mt-1">Tu saldo y movimientos.</p>
        </div>
        <Link href="/recargar" className="btn-primary">
          <Plus className="w-4 h-4" /> Recargar
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-gold p-5">
          <p className="text-xs text-fg-subtle uppercase tracking-wider mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Saldo actual
          </p>
          <p className="font-serif text-4xl font-bold text-gold">
            {formatNumber(cliente.saldo?.creditos_actuales ?? 0)}
          </p>
        </div>
        <div className="surface p-5">
          <p className="text-xs text-fg-subtle uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" /> Comprados total
          </p>
          <p className="font-serif text-4xl font-bold">
            {formatNumber(cliente.saldo?.creditos_comprados_total ?? 0)}
          </p>
        </div>
        <div className="surface p-5">
          <p className="text-xs text-fg-subtle uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-warning" /> Gastados total
          </p>
          <p className="font-serif text-4xl font-bold">
            {formatNumber(cliente.saldo?.creditos_gastados_total ?? 0)}
          </p>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-serif text-xl font-bold">Últimos consumos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-overlay">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-fg-muted">Acción</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Cantidad</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Créditos</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(consumos ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-fg-subtle">No hay consumos aún</td></tr>
              )}
              {(consumos ?? []).map((c: any, i: number) => (
                <tr key={c.id ?? i} className="border-b border-border/50">
                  <td className="px-4 py-3">{c.accion}</td>
                  <td className="px-4 py-3 text-fg-muted">{c.cantidad}</td>
                  <td className="px-4 py-3 font-mono text-warning">-{formatNumber(c.creditos_consumidos)}</td>
                  <td className="px-4 py-3 text-fg-subtle text-xs">{timeAgo(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-serif text-xl font-bold">Compras</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-overlay">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-fg-muted">Paquete</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Créditos</th>
                <th className="px-4 py-3 font-medium text-fg-muted">USD</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Estado</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(compras ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-fg-subtle">No hay compras todavía</td></tr>
              )}
              {(compras ?? []).map((c: any, i: number) => (
                <tr key={c.id ?? i} className="border-b border-border/50">
                  <td className="px-4 py-3">{c.paquete_nombre ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-success">+{formatNumber(c.creditos)}</td>
                  <td className="px-4 py-3 font-mono">${c.precio_usd}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.estado === 'confirmado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-subtle text-xs">{timeAgo(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
