import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, getClienteMetricas, clienteTieneDB } from '@/lib/cliente-db'
import { MotorToggle } from '@/components/campanas/motor-toggle'
import { formatNumber } from '@/lib/utils'
import { Zap, Pause, AlertCircle, TrendingUp } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Campañas · ACELERAME' }

export default async function CampanasPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const tieneDB = clienteTieneDB(cliente)
  const metricas = tieneDB ? await getClienteMetricas(cliente) : null

  const saldo = cliente.saldo?.creditos_actuales ?? 0
  const puedeArrancar = tieneDB && saldo > 0 && (metricas?.cuentas_ig ?? 0) > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Campañas</h1>
        <p className="text-fg-muted mt-1">Controlá tu motor de prospección.</p>
      </div>

      <div className="surface p-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-3">
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
                <h2 className="font-serif text-2xl font-bold">
                  {cliente.motor_activo ? 'Motor activo' : 'Motor pausado'}
                </h2>
                <p className="text-sm text-fg-muted">
                  {cliente.motor_activo
                    ? 'Procesando leads cada 10 minutos'
                    : 'No se está ejecutando ninguna acción'}
                </p>
              </div>
            </div>

            {!puedeArrancar && !cliente.motor_activo && (
              <div className="my-4 p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="font-medium text-warning mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Falta configuración
                </p>
                <ul className="space-y-1 text-sm text-fg-muted">
                  {!tieneDB && <li>• Configurar base de datos — <Link href="/integraciones" className="text-gold hover:underline">configurar</Link></li>}
                  {tieneDB && saldo <= 0 && <li>• Cargar créditos — <Link href="/recargar" className="text-gold hover:underline">recargar</Link></li>}
                  {tieneDB && (metricas?.cuentas_ig ?? 0) === 0 && <li>• Conectar al menos 1 cuenta de Instagram</li>}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <MotorToggle initial={cliente.motor_activo} />
            </div>
          </div>

          <div className="space-y-3">
            <StatRow label="Saldo disponible" value={formatNumber(saldo)} unit="créditos" gold />
            {metricas && (
              <>
                <StatRow label="Leads pendientes" value={formatNumber(metricas.sin_contactar)} unit="por contactar" />
                <StatRow label="Contactados hoy" value={formatNumber(metricas.contactados_hoy)} unit="DMs enviados" />
                <StatRow label="Respondieron" value={formatNumber(metricas.respondieron)} unit="conversaciones" />
                <StatRow label="Cuentas IG" value={String(metricas.cuentas_ig)} unit="conectadas" />
              </>
            )}
          </div>
        </div>
      </div>

      {tieneDB && (
        <div className="surface p-6">
          <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" /> Costo estimado por acción
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <CostoCard accion="DM Instagram" creditos={1} />
            <CostoCard accion="Email cold" creditos={0.3} />
            <CostoCard accion="WhatsApp" creditos={3} />
            <CostoCard accion="Mensaje IA" creditos={2} />
            {cliente.db_modalidad === 'managed' && (
              <CostoCard accion="Lead enriquecido (Apify)" creditos={5} />
            )}
          </div>
          <p className="text-xs text-fg-subtle mt-4">
            1 crédito = $0.10 USD. <Link href="/creditos" className="text-gold hover:underline">Ver historial completo →</Link>
          </p>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value, unit, gold = false }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <span className="text-sm text-fg-muted">{label}</span>
      <span className={`font-mono ${gold ? 'text-gold font-bold text-lg' : 'text-fg'}`}>
        {value} <span className="text-xs text-fg-subtle font-sans">{unit}</span>
      </span>
    </div>
  )
}

function CostoCard({ accion, creditos }: { accion: string; creditos: number }) {
  return (
    <div className="p-3 rounded-lg bg-bg-overlay/50 border border-border">
      <p className="text-xs text-fg-subtle uppercase tracking-wider mb-1">{accion}</p>
      <p className="font-serif text-xl font-bold">
        {creditos} <span className="text-xs text-fg-muted font-sans">cr.</span>
      </p>
    </div>
  )
}
