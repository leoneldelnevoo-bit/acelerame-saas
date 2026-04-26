import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, clienteTieneDB, listarConversaciones, listarAgendados } from '@/lib/cliente-db'
import { timeAgo } from '@/lib/utils'
import { Inbox, MessageSquare, Calendar, AlertCircle, Plug } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Bandeja · ACELERAME' }

export default async function BandejaPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const tieneDB = clienteTieneDB(cliente)

  if (!tieneDB) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-bold">Bandeja</h1>
        <div className="card-gold">
          <div className="flex items-start gap-3">
            <Plug className="w-5 h-5 text-gold shrink-0" />
            <p>Conectá tu base de datos para ver conversaciones. <Link href="/integraciones" className="text-gold hover:underline">Configurar →</Link></p>
          </div>
        </div>
      </div>
    )
  }

  let conversaciones: any[] = []
  let agendados: any[] = []
  let errorMsg: string | null = null

  try {
    const [convs, ags] = await Promise.all([
      listarConversaciones(cliente, 50),
      listarAgendados(cliente, 20),
    ])
    conversaciones = convs
    agendados = ags
  } catch (e: any) {
    errorMsg = e?.message ?? 'Error'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Bandeja</h1>
        <p className="text-fg-muted mt-1">
          Conversaciones activas y leads agendados
        </p>
      </div>

      {errorMsg && (
        <div className="surface p-4 border-danger/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0" />
            <p className="text-sm text-danger">{errorMsg}</p>
          </div>
        </div>
      )}

      {agendados.length > 0 && (
        <div className="surface p-6 border-success/40">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-success" />
            <h2 className="font-serif text-xl font-bold">Agendaron llamada</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/30">
              {agendados.length}
            </span>
          </div>
          <div className="space-y-3">
            {agendados.map((lead, i) => <ConversacionRow key={lead.handle ?? i} lead={lead} agendado />)}
          </div>
        </div>
      )}

      <div className="surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl font-bold">Conversaciones activas</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/30">
            {conversaciones.length}
          </span>
        </div>

        {conversaciones.length === 0 && !errorMsg && (
          <div className="py-12 text-center">
            <Inbox className="w-12 h-12 text-fg-subtle mx-auto mb-3" />
            <p className="text-fg-muted">Todavía no hay conversaciones activas.</p>
            <p className="text-sm text-fg-subtle mt-1">Cuando algún lead responda, aparecerá acá.</p>
          </div>
        )}

        <div className="space-y-3">
          {conversaciones.map((lead, i) => <ConversacionRow key={lead.handle ?? i} lead={lead} />)}
        </div>
      </div>
    </div>
  )
}

function ConversacionRow({ lead, agendado = false }: { lead: any; agendado?: boolean }) {
  const respuesta = lead.respuesta_lead ?? lead.historial_conversacion ?? '(sin mensaje)'
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      agendado
        ? 'bg-success/5 border-success/30 hover:border-success/50'
        : 'bg-bg-overlay/50 border-border hover:border-gold/30'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-medium truncate">@{lead.handle}</span>
          {lead.nombre && <span className="text-fg-muted text-sm truncate">· {lead.nombre}</span>}
          {lead.score && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              lead.score >= 8 ? 'bg-gold/20 text-gold' : 'bg-bg-overlay text-fg-muted'
            }`}>
              {lead.score}
            </span>
          )}
        </div>
        <span className="text-xs text-fg-subtle shrink-0">
          {lead.fecha_ultima_respuesta ? timeAgo(lead.fecha_ultima_respuesta) : ''}
        </span>
      </div>
      <p className="text-sm text-fg-muted line-clamp-2">
        {respuesta.substring(0, 200)}{respuesta.length > 200 && '…'}
      </p>
    </div>
  )
}
