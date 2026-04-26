import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, clienteTieneDB, listarCuentasIG, listarScrapingConfig } from '@/lib/cliente-db'
import {
  Database, CheckCircle2, AlertCircle, Plug, Instagram, Mail, MessageSquare,
  Sparkles, Workflow, Calendar, Bot, Settings as SettingsIcon, ArrowRight,
  Zap, Lock, Search, Send
} from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Integraciones · ACELERAME' }

export default async function IntegracionesPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const tieneDB = clienteTieneDB(cliente)
  const cuentasIG = tieneDB ? await listarCuentasIG(cliente) : []
  const targets = tieneDB ? await listarScrapingConfig(cliente) : []
  const tieneIG = cuentasIG.length > 0
  const tieneTargets = targets.length > 0

  // Anthropic key se valida por presencia de la env var (cliente no la maneja)
  const tieneAnthropicKey = !!process.env.ANTHROPIC_API_KEY
  const tieneResend = !!process.env.RESEND_API_KEY

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Integraciones</h1>
        <p className="text-fg-muted mt-1">
          Conectá las piezas que necesita tu motor de prospección para correr.
        </p>
      </div>

      {/* === SECCIÓN 1: BASE DE DATOS === */}
      <SeccionTitulo icon={Database} titulo="Base de datos" />
      <CardConectable
        titulo="Tu fuente de leads"
        descripcion="Acá viven tus leads, conversaciones y resultados."
        icon={Database}
        conectado={tieneDB}
        body={
          tieneDB ? (
            <div className="text-sm space-y-1">
              <p>
                <span className="text-fg-muted">Modalidad:</span>{' '}
                <span className="font-medium">
                  {cliente.db_modalidad === 'byodb' ? 'BYODB (tu Supabase)' : 'Managed (nuestro Supabase)'}
                </span>
              </p>
              <p>
                <span className="text-fg-muted">Schema:</span>{' '}
                <span className="font-mono text-gold">{cliente.schema_db}</span>
              </p>
              <p>
                <span className="text-fg-muted">Estado:</span>{' '}
                <span className="text-success">{cliente.supabase_test_status}</span>
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <ModalidadCard
                titulo="Managed"
                descripcion="Nosotros la creamos por vos. Sin configurar nada."
                recomendado
                link="/integraciones/setup-managed"
                ventajas={['Sin configuración', 'Listo en 30 seg', 'Apify scraping incluido']}
              />
              <ModalidadCard
                titulo="BYODB"
                descripcion="Traés tu propio Supabase. Para usuarios técnicos."
                link="/integraciones/conectar-supabase"
                ventajas={['Datos 100% tuyos', 'Sin lock-in', 'Tu propia infraestructura']}
              />
            </div>
          )
        }
      />

      {/* === SECCIÓN 2: PROSPECCIÓN === */}
      <SeccionTitulo icon={Search} titulo="Prospección" />

      <CardConectable
        titulo="Apify — Scraping de Instagram"
        descripcion="Bot que encuentra leads por hashtags, cuentas o keywords."
        icon={Search}
        conectado={tieneTargets}
        body={
          <div className="text-sm">
            {tieneTargets ? (
              <p className="text-fg-muted">
                <span className="text-fg">{targets.length} targets activos:</span>{' '}
                {targets.slice(0, 3).map((t: any, i: number) => (
                  <span key={i} className="font-mono text-xs px-1.5 py-0.5 mx-0.5 rounded bg-bg-overlay text-gold">
                    {t.tipo === 'hashtag' ? '#' : '@'}{t.valor}
                  </span>
                ))}
                {targets.length > 3 && <span> y {targets.length - 3} más…</span>}
              </p>
            ) : (
              <p className="text-fg-muted">
                Configurá hashtags, cuentas o keywords para que Apify encuentre leads automáticamente.
              </p>
            )}
            {tieneDB && (
              <Link
                href="/integraciones/apify"
                className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-hover mt-3"
              >
                {tieneTargets ? 'Editar targets' : 'Configurar targets'} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        }
        bloqueado={!tieneDB}
        razonBloqueo="Conectá tu base de datos primero"
      />

      <CardConectable
        titulo="Instagram — Cuentas para enviar DMs"
        descripcion="Cuentas IG con sessionid que envían los mensajes."
        icon={Instagram}
        conectado={tieneIG}
        body={
          <div className="text-sm">
            {tieneIG ? (
              <p className="text-fg-muted">
                <span className="text-fg">{cuentasIG.length} cuenta(s) activa(s):</span>{' '}
                {cuentasIG.map((c: any) => `@${c.username}`).join(', ')}
              </p>
            ) : (
              <p className="text-fg-muted">
                Cargá las cuentas IG que mandarán los DMs. Necesitás el sessionid de cada cuenta.
              </p>
            )}
            {tieneDB && (
              <Link
                href="/integraciones/instagram"
                className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-hover mt-3"
              >
                {tieneIG ? 'Gestionar cuentas' : 'Cargar cuenta'} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        }
        bloqueado={!tieneDB}
        razonBloqueo="Conectá tu base de datos primero"
      />

      {/* === SECCIÓN 3: IA Y AUTOMATIZACIÓN === */}
      <SeccionTitulo icon={Bot} titulo="IA y automatización" />

      <CardConectable
        titulo="Claude IA — Mensajes personalizados"
        descripcion="La IA que personaliza cada mensaje según el lead."
        icon={Sparkles}
        conectado={tieneAnthropicKey}
        gestionadoSistema
        body={
          <p className="text-sm text-fg-muted">
            {tieneAnthropicKey
              ? 'Claude está activo. Cada mensaje se genera personalizado según la bio, el nicho y la respuesta del lead.'
              : 'La IA todavía no está conectada. Avisanos para activarla.'}
          </p>
        }
      />

      <CardConectable
        titulo="n8n — Motor de prospección"
        descripcion="El cerebro que orquesta scraping, mensajes y followups."
        icon={Workflow}
        conectado={cliente.motor_activo}
        gestionadoSistema
        body={
          <div className="text-sm">
            <p className="text-fg-muted mb-2">
              {cliente.motor_activo
                ? 'Motor corriendo cada 10 minutos.'
                : 'Motor pausado. Activalo cuando estés listo para prospectar.'}
            </p>
            <Link
              href="/campanas"
              className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-hover"
            >
              Ir al motor <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        }
      />

      {/* === SECCIÓN 4: COMUNICACIÓN === */}
      <SeccionTitulo icon={Send} titulo="Canales de comunicación" />

      <CardProximamente
        titulo="Email cold outreach (Resend)"
        descripcion="Envío de cold emails con dominio verificado y SPF/DKIM."
        icon={Mail}
        estado={tieneResend ? 'configurado' : 'proximamente'}
      />

      <CardProximamente
        titulo="WhatsApp Business"
        descripcion="Outreach automático por WhatsApp cuando el lead deja su número."
        icon={MessageSquare}
        estado="proximamente"
      />

      <CardProximamente
        titulo="ManyChat"
        descripcion="Webhooks de Instagram DM para responder en tiempo real."
        icon={Bot}
        estado="proximamente"
      />

      <CardProximamente
        titulo="Calendly / agenda"
        descripcion="Link de agendado que se manda cuando un lead acepta llamada."
        icon={Calendar}
        estado="proximamente"
      />
    </div>
  )
}

// =============== Helpers de UI ===============

function SeccionTitulo({ icon: Icon, titulo }: { icon: any; titulo: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 border-t border-border/40">
      <Icon className="w-4 h-4 text-gold" />
      <h2 className="text-xs uppercase tracking-wider text-fg-muted font-medium">{titulo}</h2>
    </div>
  )
}

function CardConectable({
  titulo,
  descripcion,
  icon: Icon,
  conectado,
  body,
  bloqueado,
  razonBloqueo,
  gestionadoSistema,
}: {
  titulo: string
  descripcion: string
  icon: any
  conectado: boolean
  body?: React.ReactNode
  bloqueado?: boolean
  razonBloqueo?: string
  gestionadoSistema?: boolean
}) {
  return (
    <div className={`surface p-6 ${bloqueado ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
          conectado ? 'bg-success/10 border border-success/30' : 'bg-bg-overlay border border-border'
        }`}>
          <Icon className={`w-5 h-5 ${conectado ? 'text-success' : 'text-fg-muted'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-serif text-lg font-bold">{titulo}</h3>
              <p className="text-sm text-fg-muted">{descripcion}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {conectado ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </span>
              ) : bloqueado ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-overlay border border-border text-fg-muted text-xs">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-overlay border border-border text-fg-muted text-xs">
                  <AlertCircle className="w-3 h-3" /> Sin conectar
                </span>
              )}
              {gestionadoSistema && (
                <span className="text-[10px] text-fg-subtle">gestionado por sistema</span>
              )}
            </div>
          </div>
          {bloqueado && razonBloqueo && (
            <p className="text-xs text-warning mt-2">{razonBloqueo}</p>
          )}
          {body && !bloqueado && <div className="mt-3">{body}</div>}
        </div>
      </div>
    </div>
  )
}

function CardProximamente({
  titulo,
  descripcion,
  icon: Icon,
  estado,
}: {
  titulo: string
  descripcion: string
  icon: any
  estado: 'proximamente' | 'configurado'
}) {
  return (
    <div className={`surface p-5 ${estado === 'proximamente' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-bg-overlay border border-border flex items-center justify-center">
          <Icon className="w-5 h-5 text-fg-muted" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-serif font-bold">{titulo}</h3>
              <p className="text-sm text-fg-muted">{descripcion}</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-overlay border border-border text-fg-muted text-xs">
              {estado === 'configurado' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-success" /> Configurado
                </>
              ) : (
                'Próximamente'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalidadCard({ titulo, descripcion, recomendado, link, ventajas }: any) {
  const className = recomendado ? 'card-gold p-5 relative' : 'surface p-5'
  return (
    <Link href={link} className={`${className} hover:border-gold/50 transition-colors block`}>
      {recomendado && (
        <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-gold text-bg-base text-xs font-bold">
          Recomendado
        </span>
      )}
      <h3 className="font-serif text-lg font-bold mb-1">{titulo}</h3>
      <p className="text-sm text-fg-muted mb-3">{descripcion}</p>
      <ul className="space-y-1 text-xs text-fg-muted">
        {ventajas.map((v: string, i: number) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-success" /> {v}
          </li>
        ))}
      </ul>
    </Link>
  )
}
