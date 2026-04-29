import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, clienteTieneDB } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { Database, CheckCircle2, AlertCircle, Instagram, Mail, MessageSquare, Search, Sparkles, Calendar, Bot, Zap, ExternalLink } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Integraciones · ACELERAME' }

export default async function IntegracionesPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const tieneDB = clienteTieneDB(cliente)
  const admin = createMasterAdminClient()

  // Verificar config IA
  const { data: config } = await admin
    .from('cliente_config')
    .select('producto_nombre, buyer_persona_descripcion, activo')
    .eq('cliente_id', cliente.id)
    .maybeSingle()
  const tieneConfig = !!(config?.producto_nombre)

  // Verificar cuentas IG
  const { count: cuentasIG } = await admin
    .schema('public')
    .from('instagram_cuentas')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', cliente.id)
    .eq('estado', 'activa')

  // Verificar scraping targets
  const { count: scrapingTargets } = await admin
    .schema('public')
    .from('scraping_config')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', cliente.id)
    .eq('activo', true)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Integraciones</h1>
        <p className="text-fg-muted mt-1">
          Conectá las piezas que necesita tu motor de prospección para correr.
        </p>
      </div>

      {/* === Base de datos === */}
      <section>
        <h2 className="font-serif text-xl font-bold mb-3">Base de datos</h2>
        <div className="surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Database className="w-7 h-7 text-gold mt-1" />
              <div>
                <p className="font-bold">Tu fuente de leads</p>
                <p className="text-sm text-fg-muted">
                  {tieneDB
                    ? `Modalidad: ${cliente.db_modalidad === 'byodb' ? 'BYODB (tu Supabase)' : 'Managed (nuestro Supabase)'}`
                    : 'Acá viven tus leads, conversaciones y resultados.'}
                </p>
              </div>
            </div>
            <StatusBadge ok={tieneDB} />
          </div>
        </div>
      </section>

      {/* === Prospección === */}
      <section>
        <h2 className="font-serif text-xl font-bold mb-3">Prospección</h2>
        <div className="space-y-3">
          <IntegrationCard
            icon={Search}
            title="Apify — Scraping de Instagram"
            description="Bot que encuentra leads por hashtags, cuentas o keywords."
            ok={(scrapingTargets ?? 0) > 0}
            badge={(scrapingTargets ?? 0) > 0 ? `${scrapingTargets} targets activos` : 'Sin targets'}
            href="/configuracion/leads"
            ctaLabel="Configurar targets"
          />
          <IntegrationCard
            icon={Instagram}
            title="Instagram — Cuentas para enviar DMs"
            description="Cuentas IG con sessionid que envían los mensajes."
            ok={(cuentasIG ?? 0) > 0}
            badge={(cuentasIG ?? 0) > 0 ? `${cuentasIG} cuenta(s) activa(s)` : 'Sin cuentas'}
            href="/configuracion/cuenta-ig"
            ctaLabel="Cargar cuenta"
          />
        </div>
      </section>

      {/* === IA y automatización === */}
      <section>
        <h2 className="font-serif text-xl font-bold mb-3">IA y automatización</h2>
        <div className="space-y-3">
          <IntegrationCard
            icon={Sparkles}
            title="Personalización IA — Tu producto y tu voz"
            description="La IA usa esto para personalizar cada mensaje según tu negocio."
            ok={tieneConfig}
            badge={tieneConfig ? `${config?.producto_nombre}` : 'Falta configurar'}
            href="/configuracion/producto"
            ctaLabel="Editar personalización"
          />
          <IntegrationCard
            icon={Bot}
            title="Claude IA — Mensajes personalizados"
            description="La IA que personaliza cada mensaje según el lead."
            ok={true}
            badge="Activo (gestionado por sistema)"
            managedBySystem
          />
          <IntegrationCard
            icon={Zap}
            title="n8n — Motor de prospección"
            description="El cerebro que orquesta scraping, mensajes y followups."
            ok={cliente.motor_activo}
            badge={cliente.motor_activo ? 'Corriendo cada 10 min' : 'Pausado'}
            managedBySystem
          />
        </div>
      </section>

      {/* === Comunicación === */}
      <section>
        <h2 className="font-serif text-xl font-bold mb-3">Canales de comunicación</h2>
        <div className="space-y-3">
          <IntegrationCard
            icon={Calendar}
            title="Calendario / Agenda"
            description="Link de agendado que se manda cuando un lead acepta llamada."
            ok={false}
            badge="Configurar en /configuracion/agenda"
            href="/configuracion/agenda"
            ctaLabel="Configurar"
          />
          <IntegrationCard
            icon={Mail}
            title="Email cold outreach (Resend)"
            description="Envío de emails desde el dominio verificado."
            ok={true}
            badge="Gestionado por sistema"
            managedBySystem
          />
        </div>
      </section>

      {/* === Próximamente (collapsible) === */}
      <details className="surface p-5">
        <summary className="cursor-pointer font-serif text-lg font-bold">
          Próximamente
        </summary>
        <div className="mt-4 grid md:grid-cols-2 gap-3 opacity-60">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">WhatsApp Business</p>
              <p className="text-xs text-fg-muted">Outreach por WA cuando el lead deja su número.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">ManyChat</p>
              <p className="text-xs text-fg-muted">Webhooks para responder en tiempo real.</p>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

function StatusBadge({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs">
        <CheckCircle2 className="w-3 h-3" /> Conectado
      </span>
    )
  }
  return (
    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 border border-warning/30 text-warning text-xs">
      <AlertCircle className="w-3 h-3" /> Sin conectar
    </span>
  )
}

function IntegrationCard({
  icon: Icon, title, description, ok, badge, href, ctaLabel, managedBySystem,
}: {
  icon: any; title: string; description: string; ok: boolean
  badge?: string; href?: string; ctaLabel?: string; managedBySystem?: boolean
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Icon className={`w-6 h-6 mt-1 ${ok ? 'text-gold' : 'text-fg-muted'}`} />
          <div className="flex-1 min-w-0">
            <p className="font-bold">{title}</p>
            <p className="text-sm text-fg-muted mt-0.5">{description}</p>
            {badge && (
              <p className={`text-xs mt-2 ${ok ? 'text-success' : 'text-fg-subtle'}`}>
                {badge}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <StatusBadge ok={ok} />
          {href && ctaLabel && !managedBySystem && (
            <Link href={href} className="text-xs text-gold hover:underline inline-flex items-center gap-1">
              {ctaLabel} <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
