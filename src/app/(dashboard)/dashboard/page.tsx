import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getClienteContext, getClienteMetricas, clienteTieneDB } from '@/lib/cliente-db'
import { formatNumber } from '@/lib/utils'
import {
  Users, MessageSquare, Calendar, Zap, Database, Plug,
  ArrowRight, AlertCircle, CheckCircle2, Pause
} from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Dashboard · ACELERAME' }

export default async function DashboardPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const tieneDB = clienteTieneDB(cliente)
  const metricas = tieneDB ? await getClienteMetricas(cliente) : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl font-bold">
          Hola, {cliente.nombre_completo.split(' ')[0]} 👋
        </h1>
        <p className="text-fg-muted mt-2">
          {tieneDB
            ? 'Acá está el resumen de tu motor de prospección.'
            : 'Configurá tu base de datos para empezar.'}
        </p>
      </div>

      {/* Estado del motor */}
      <div className={cliente.motor_activo ? 'card-gold p-6' : 'surface p-6'}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {cliente.motor_activo ? (
              <div className="w-12 h-12 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-success animate-pulse" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-bg-overlay border border-border flex items-center justify-center">
                <Pause className="w-6 h-6 text-fg-muted" />
              </div>
            )}
            <div>
              <p className="font-serif text-xl font-bold">
                {cliente.motor_activo ? 'Motor activo' : 'Motor pausado'}
              </p>
              <p className="text-sm text-fg-muted">
                {cliente.motor_activo
                  ? 'Procesando leads cada 10 minutos'
                  : 'Activalo cuando estés listo para prospectar'}
              </p>
            </div>
          </div>
          <Link href="/campanas" className="btn-primary">
            {cliente.motor_activo ? 'Ver campaña' : 'Activar motor'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Si no tiene DB, mostrar onboarding */}
      {!tieneDB && (
        <div className="card-gold p-8">
          <Database className="w-10 h-10 text-gold mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2">Te falta conectar tu base de datos</h2>
          <p className="text-fg-muted mb-6">
            Para empezar, andá al wizard de configuración y elegí cómo querés gestionar tus leads.
          </p>
          <Link href="/integraciones" className="btn-primary">
            Configurar ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Métricas si tiene DB */}
      {tieneDB && metricas && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total leads"
              value={formatNumber(metricas.total)}
              icon={Users}
              href="/leads"
            />
            <KPICard
              label="Sin contactar"
              value={formatNumber(metricas.sin_contactar)}
              icon={Users}
              hint="Listos para prospectar"
            />
            <KPICard
              label="Respondieron"
              value={formatNumber(metricas.respondieron)}
              icon={MessageSquare}
              gold
              href="/bandeja"
            />
            <KPICard
              label="Agendados"
              value={formatNumber(metricas.agendados)}
              icon={Calendar}
              success
              href="/bandeja"
            />
          </div>

          {/* Funnel de pipeline */}
          <div className="surface p-6">
            <h2 className="font-serif text-xl font-bold mb-4">Pipeline funnel</h2>
            <div className="space-y-2">
              <FunnelBar
                label="Sin contactar (etapa 0)"
                value={metricas.sin_contactar}
                total={metricas.total}
                color="bg-fg-subtle"
              />
              <FunnelBar
                label="Contactados (etapas 1-11)"
                value={metricas.total - metricas.sin_contactar - metricas.agendados}
                total={metricas.total}
                color="bg-info"
              />
              <FunnelBar
                label="Respondieron (etapas pares)"
                value={metricas.respondieron}
                total={metricas.total}
                color="bg-gold"
              />
              <FunnelBar
                label="Agendados (etapa 12)"
                value={metricas.agendados}
                total={metricas.total}
                color="bg-success"
              />
            </div>
          </div>

          {/* Estado integraciones */}
          <div className="surface p-6">
            <h2 className="font-serif text-xl font-bold mb-4">Integraciones</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <IntegrationStatus
                label="Base de datos"
                ok={tieneDB}
                detail={cliente.db_modalidad === 'byodb' ? 'BYODB conectado' : 'Managed activo'}
              />
              <IntegrationStatus
                label="Cuentas Instagram"
                ok={metricas.cuentas_ig > 0}
                detail={metricas.cuentas_ig > 0 ? `${metricas.cuentas_ig} cuenta(s)` : 'Sin conectar'}
              />
              <IntegrationStatus
                label="Saldo de créditos"
                ok={(cliente.saldo?.creditos_actuales ?? 0) > 0}
                detail={`${formatNumber(cliente.saldo?.creditos_actuales ?? 0)} cr`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KPICard({ label, value, icon: Icon, hint, gold, success, href }: any) {
  const className = gold
    ? 'card-gold p-5'
    : success
    ? 'surface p-5 border-success/30'
    : 'surface p-5'

  const Wrapper: any = href ? Link : 'div'
  const wrapperProps = href ? { href } : {}

  return (
    <Wrapper {...wrapperProps} className={`${className} ${href ? 'hover:border-gold/50 transition-colors' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-fg-subtle uppercase tracking-wider">{label}</p>
        <Icon className={`w-4 h-4 ${gold ? 'text-gold' : success ? 'text-success' : 'text-fg-muted'}`} />
      </div>
      <p className={`font-serif text-3xl font-bold ${gold ? 'text-gold' : success ? 'text-success' : ''}`}>
        {value}
      </p>
      {hint && <p className="text-xs text-fg-subtle mt-1">{hint}</p>}
    </Wrapper>
  )
}

function FunnelBar({ label, value, total, color }: any) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-fg-muted">{label}</span>
        <span className="font-mono text-fg">
          {formatNumber(value)} <span className="text-fg-subtle">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2 bg-bg-overlay rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function IntegrationStatus({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="bg-bg-overlay/50 rounded-lg p-3 border border-border">
      <div className="flex items-center gap-2 mb-1">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <AlertCircle className="w-4 h-4 text-warning" />
        )}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-xs text-fg-muted ml-6">{detail}</p>
    </div>
  )
}
