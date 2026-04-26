import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, clienteTieneDB, listarScrapingConfig } from '@/lib/cliente-db'
import { ArrowLeft, Search, Hash, AtSign, Type } from 'lucide-react'
import { ApifyTargetsForm } from './form'

export const revalidate = 0
export const metadata = { title: 'Apify Scraping · ACELERAME' }

export default async function ApifyPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')
  if (!clienteTieneDB(cliente)) redirect('/integraciones')

  const targets = await listarScrapingConfig(cliente)
  const porTipo = targets.reduce((acc: Record<string, any[]>, t: any) => {
    if (!acc[t.tipo]) acc[t.tipo] = []
    acc[t.tipo].push(t)
    return acc
  }, {})

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/integraciones" className="text-fg-muted hover:text-gold inline-flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver a Integraciones
      </Link>

      <div className="surface p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Search className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Apify — Targets de scraping</h1>
            <p className="text-fg-muted text-sm">
              Configurá qué buscar en Instagram para encontrar leads.
            </p>
          </div>
        </div>

        {/* Targets actuales agrupados por tipo */}
        {targets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm uppercase tracking-wider text-fg-muted font-medium mb-3">
              Targets activos ({targets.length})
            </h3>
            <div className="space-y-4">
              {porTipo.hashtag && (
                <TargetGroup
                  icon={Hash}
                  titulo="Hashtags"
                  items={porTipo.hashtag}
                  prefix="#"
                />
              )}
              {porTipo.cuenta_seguidores && (
                <TargetGroup
                  icon={AtSign}
                  titulo="Cuentas (seguidores)"
                  items={porTipo.cuenta_seguidores}
                  prefix="@"
                />
              )}
              {porTipo.cuenta_comentarios && (
                <TargetGroup
                  icon={AtSign}
                  titulo="Cuentas (comentadores)"
                  items={porTipo.cuenta_comentarios}
                  prefix="@"
                />
              )}
              {porTipo.keyword && (
                <TargetGroup
                  icon={Type}
                  titulo="Palabras clave"
                  items={porTipo.keyword}
                  prefix=""
                />
              )}
            </div>
          </div>
        )}

        {/* Form para agregar */}
        <h3 className="text-sm uppercase tracking-wider text-fg-muted font-medium mb-3">
          {targets.length > 0 ? 'Agregar más targets' : 'Tus primeros targets'}
        </h3>

        <div className="bg-bg-overlay/30 border border-border rounded-lg p-4 mb-4 text-sm text-fg-muted">
          <p className="font-medium text-fg mb-2">💡 Tipos de targets</p>
          <ul className="space-y-1.5">
            <li><strong className="text-gold">Hashtags</strong>: posts con ese hashtag (ej: <code>cafespecialty</code>)</li>
            <li><strong className="text-gold">Seguidores de cuenta</strong>: gente que sigue a una cuenta (ej: <code>nespresso</code>)</li>
            <li><strong className="text-gold">Comentadores</strong>: gente que comenta en una cuenta</li>
            <li><strong className="text-gold">Keywords</strong>: búsqueda libre en bios y posts</li>
          </ul>
          <p className="mt-2 text-xs text-warning">
            💰 Costo: 5 créditos por lead enriquecido. Si pedís 20 leads × 3 hashtags = 300 créditos.
          </p>
        </div>

        <ApifyTargetsForm saldo={cliente.saldo?.creditos_actuales ?? 0} />
      </div>
    </div>
  )
}

function TargetGroup({ icon: Icon, titulo, items, prefix }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-fg-muted" />
        <span className="text-sm font-medium">{titulo}</span>
        <span className="text-xs text-fg-subtle">({items.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((t: any) => (
          <span key={t.id} className="font-mono text-xs px-2 py-1 rounded bg-bg-overlay border border-border text-gold">
            {prefix}{t.valor}
          </span>
        ))}
      </div>
    </div>
  )
}
