import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { formatNumber, formatUSD } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Recargar · ACELERAME' }

export default async function RecargarPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: paquetes } = await admin
    .from('paquetes_credito')
    .select('*')
    .eq('activo', true)
    .order('precio_usd', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Recargar créditos</h1>
        <p className="text-fg-muted mt-1">Pagás con USDT (red TRON). Confirmación blockchain en ~3 minutos.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {(paquetes ?? []).map((p: any) => (
          <Link
            key={p.codigo}
            href={`/recargar/${p.codigo}`}
            className={p.destacado ? 'card-gold p-6 hover:border-gold/70 transition-colors' : 'surface p-6 hover:border-gold/50 transition-colors'}
          >
            {p.destacado && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-gold text-bg-base text-xs font-bold mb-3">
                Más elegido
              </span>
            )}
            <h3 className="font-serif text-2xl font-bold mb-1">{p.nombre}</h3>
            <p className="font-serif text-4xl font-bold text-gold mb-1">{formatUSD(p.precio_usd)}</p>
            <p className="text-sm text-fg-muted mb-4">{formatNumber(p.creditos)} créditos</p>
            <p className="text-xs text-fg-subtle">${(p.precio_usd / p.creditos).toFixed(3)} por crédito</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
