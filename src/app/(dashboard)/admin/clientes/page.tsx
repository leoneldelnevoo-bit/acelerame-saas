import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { formatNumber, timeAgo } from '@/lib/utils'

export const revalidate = 0
export const metadata = { title: 'Admin · Clientes' }

export default async function AdminClientesPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')
  if (cliente.email !== 'leoneldelnevoo@gmail.com') redirect('/dashboard')

  const admin = createMasterAdminClient()
  const { data: clientes } = await admin.from('clientes').select(`
    id, slug, nombre_completo, email, empresa, estado, motor_activo, db_modalidad, es_founder,
    onboarding_completado, created_at,
    saldos:creditos_saldo(creditos_actuales)
  `).order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Clientes</h1>
        <p className="text-fg-muted mt-1">{(clientes ?? []).length} cuentas registradas</p>
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-overlay">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-fg-muted">Cliente</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Empresa</th>
                <th className="px-4 py-3 font-medium text-fg-muted">DB</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Saldo</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Motor</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Onboarding</th>
                <th className="px-4 py-3 font-medium text-fg-muted">Alta</th>
              </tr>
            </thead>
            <tbody>
              {(clientes ?? []).map((c: any) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{c.nombre_completo}</p>
                      <p className="text-xs text-fg-subtle">{c.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.empresa ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.db_modalidad ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-bg-overlay">
                        {c.db_modalidad}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-gold">
                    {formatNumber(c.saldos?.[0]?.creditos_actuales ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    {c.motor_activo ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success">activo</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-bg-overlay text-fg-muted">pausado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.onboarding_completado ? (
                      <span className="text-xs text-success">✓</span>
                    ) : (
                      <span className="text-xs text-warning">pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-subtle">{timeAgo(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
