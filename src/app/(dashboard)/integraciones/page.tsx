import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, clienteTieneDB } from '@/lib/cliente-db'
import { Database, CheckCircle2, AlertCircle, Plug, Instagram, Mail, MessageSquare } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Integraciones · ACELERAME' }

export default async function IntegracionesPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const tieneDB = clienteTieneDB(cliente)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Integraciones</h1>
        <p className="text-fg-muted mt-1">
          Conectá las piezas que necesita tu motor para correr.
        </p>
      </div>

      {/* DB Modality */}
      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-gold" />
          <div>
            <h2 className="font-serif text-xl font-bold">Base de datos</h2>
            <p className="text-sm text-fg-muted">¿Dónde se guardan tus leads?</p>
          </div>
          {tieneDB && (
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs">
              <CheckCircle2 className="w-3 h-3" /> Conectado
            </span>
          )}
        </div>

        {!tieneDB ? (
          <div className="grid md:grid-cols-2 gap-4">
            <ModalidadCard
              titulo="Managed"
              descripcion="Nosotros la creamos por vos. Sin configurar nada. Recomendado."
              recomendado
              link="/integraciones/setup-managed"
              ventajas={['Sin configuración', 'Listo en 30 segundos', 'Apify scraping incluido']}
            />
            <ModalidadCard
              titulo="BYODB"
              descripcion="Traés tu propio Supabase. Para usuarios técnicos."
              link="/integraciones/conectar-supabase"
              ventajas={['Datos 100% tuyos', 'Sin lock-in', 'Tu propia infraestructura']}
            />
          </div>
        ) : (
          <div className="bg-bg-overlay/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Modalidad: {cliente.db_modalidad === 'byodb' ? 'BYODB (tu Supabase)' : 'Managed (nuestro Supabase)'}
                </p>
                <p className="text-sm text-fg-muted mt-1">
                  Schema: <span className="font-mono text-gold">{cliente.schema_db}</span>
                </p>
              </div>
              <span className="text-xs text-fg-subtle">Estado: {cliente.supabase_test_status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Instagram */}
      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <Instagram className="w-6 h-6 text-gold" />
          <div>
            <h2 className="font-serif text-xl font-bold">Instagram</h2>
            <p className="text-sm text-fg-muted">Conectá las cuentas que enviarán los DMs</p>
          </div>
        </div>
        <p className="text-sm text-fg-muted">
          Configuración disponible próximamente. Por ahora, las cuentas se cargan desde el panel admin.
        </p>
      </div>

      {/* Email */}
      <div className="surface p-6 opacity-60">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-6 h-6 text-fg-muted" />
          <div>
            <h2 className="font-serif text-xl font-bold">Email (Resend)</h2>
            <p className="text-sm text-fg-muted">Cold emails — próximamente</p>
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="surface p-6 opacity-60">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-6 h-6 text-fg-muted" />
          <div>
            <h2 className="font-serif text-xl font-bold">WhatsApp Business</h2>
            <p className="text-sm text-fg-muted">Outreach por WA — próximamente</p>
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
