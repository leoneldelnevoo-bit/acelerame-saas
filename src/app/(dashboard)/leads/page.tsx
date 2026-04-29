import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, createClienteSupabase, clienteTieneDB } from '@/lib/cliente-db'
import { formatNumber, timeAgo } from '@/lib/utils'
import { Search, Plug, AlertCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Leads · ACELERAME' }

const ETAPA_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Sin contactar', color: 'bg-bg-overlay text-fg-muted' },
  1: { label: 'Apertura enviada', color: 'bg-info/10 text-info' },
  2: { label: 'Respondió', color: 'bg-gold/20 text-gold' },
  3: { label: 'Calificando', color: 'bg-info/10 text-info' },
  4: { label: 'Respondió', color: 'bg-gold/20 text-gold' },
  5: { label: 'Identificando dolor', color: 'bg-info/10 text-info' },
  6: { label: 'Respondió', color: 'bg-gold/20 text-gold' },
  7: { label: 'Solución planteada', color: 'bg-info/10 text-info' },
  8: { label: 'Respondió', color: 'bg-gold/20 text-gold' },
  9: { label: 'Pitch enviado', color: 'bg-info/10 text-info' },
  10: { label: 'Aceptó llamada', color: 'bg-success/10 text-success' },
  11: { label: 'Link enviado', color: 'bg-success/10 text-success' },
  12: { label: 'Agendado', color: 'bg-success/20 text-success font-semibold' },
  99: { label: 'Descartado', color: 'bg-danger/10 text-danger' },
}

const PAGE_SIZE = 50

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; etapa?: string; search?: string }>
}) {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const tieneDB = clienteTieneDB(cliente)
  const clienteDB = tieneDB ? createClienteSupabase(cliente) : null

  if (!tieneDB || !clienteDB) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-bold">Leads</h1>
        <div className="card-gold">
          <div className="flex items-start gap-4">
            <Plug className="w-6 h-6 text-gold shrink-0" />
            <div>
              <h2 className="font-serif text-xl font-bold mb-2">Conectá tu base de datos</h2>
              <p className="text-fg-muted mb-4">
                Para ver tus leads necesitás configurar tu fuente de datos.
              </p>
              <Link href="/integraciones" className="btn-primary">Configurar</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const etapaFilter = params.etapa
  const search = (params.search ?? '').trim()

  let query = clienteDB
    .from('prospeccion_leads')
    .select('handle,nombre,bio,etapa,score,respuesta_lead,ultimo_contacto,seguidores', { count: 'exact' })
    .order('etapa', { ascending: false })
    .order('score', { ascending: false, nullsFirst: false })

  // FIX MULTI-TENANT: filtrar por cliente_id solo si es Managed
  if (cliente.db_modalidad === 'managed') {
    query = query.eq('cliente_id', cliente.id)
  }

  if (etapaFilter !== undefined && etapaFilter !== '') {
    query = query.eq('etapa', parseInt(etapaFilter))
  }

  if (search) {
    query = query.or(`handle.ilike.%${search}%,nombre.ilike.%${search}%,bio.ilike.%${search}%`)
  }

  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  let leads: any[] = []
  let total = 0
  let errorMsg: string | null = null

  try {
    const { data, count, error } = await query
    if (error) throw error
    leads = data ?? []
    total = count ?? 0
  } catch (e: any) {
    errorMsg = e?.message ?? 'Error leyendo leads'
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Leads</h1>
          <p className="text-fg-muted mt-1">
            {formatNumber(total)} leads · página {page} de {Math.max(totalPages, 1)}
          </p>
        </div>
      </div>

      <form className="surface p-4 flex flex-col md:flex-row gap-3" action="/leads">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por @handle, nombre o bio…"
            className="input pl-9"
          />
        </div>
        <select name="etapa" defaultValue={etapaFilter ?? ''} className="input md:w-56">
          <option value="">Todas las etapas</option>
          <option value="0">Sin contactar</option>
          <option value="1">Apertura enviada</option>
          <option value="2">Respondieron</option>
          <option value="6">Convirtiendo</option>
          <option value="12">Agendados</option>
          <option value="99">Descartados</option>
        </select>
        <button type="submit" className="btn-primary">
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </form>

      {errorMsg && (
        <div className="surface p-4 border-danger/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0" />
            <p className="text-sm text-danger">{errorMsg}</p>
          </div>
        </div>
      )}

      {!errorMsg && (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-overlay border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-fg-muted">Handle</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">Nombre</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">Etapa</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">Score</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">Seguidores</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">Última actividad</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-fg-muted">
                      {search || etapaFilter
                        ? 'No hay leads que coincidan con esos filtros.'
                        : 'No tenés leads todavía. Configurá scraping o importá una base desde /configuracion/leads.'}
                    </td>
                  </tr>
                )}
                {leads.map((lead, i) => {
                  const etapaInfo = ETAPA_LABELS[lead.etapa] ?? { label: `Etapa ${lead.etapa}`, color: 'bg-bg-overlay' }
                  return (
                    <tr key={lead.handle ?? i} className="border-b border-border/50 hover:bg-bg-overlay/50 transition-colors">
                      <td className="px-4 py-3 font-mono">@{lead.handle ?? '—'}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{lead.nombre ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${etapaInfo.color}`}>
                          {etapaInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {lead.score != null ? (
                          <span className={lead.score >= 7 ? 'text-gold' : 'text-fg-muted'}>{lead.score}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {lead.seguidores != null ? formatNumber(lead.seguidores) : '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-subtle text-xs">
                        {lead.ultimo_contacto ? timeAgo(lead.ultimo_contacto) : 'Nunca contactado'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
              <span className="text-fg-muted">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {formatNumber(total)}
              </span>
              <div className="flex items-center gap-2">
                <PaginationLink enabled={page > 1} href={buildUrl({ page: page - 1, etapa: etapaFilter, search })}>
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </PaginationLink>
                <PaginationLink enabled={page < totalPages} href={buildUrl({ page: page + 1, etapa: etapaFilter, search })}>
                  Siguiente <ChevronRight className="w-4 h-4" />
                </PaginationLink>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function buildUrl(params: { page: number; etapa?: string; search?: string }) {
  const sp = new URLSearchParams()
  if (params.page > 1) sp.set('page', String(params.page))
  if (params.etapa) sp.set('etapa', params.etapa)
  if (params.search) sp.set('search', params.search)
  const q = sp.toString()
  return `/leads${q ? `?${q}` : ''}`
}

function PaginationLink({ enabled, href, children }: { enabled: boolean; href: string; children: React.ReactNode }) {
  if (!enabled) return <span className="btn-ghost text-sm opacity-40 cursor-not-allowed">{children}</span>
  return <Link href={href} className="btn-ghost text-sm"><>{children}</></Link>
}
