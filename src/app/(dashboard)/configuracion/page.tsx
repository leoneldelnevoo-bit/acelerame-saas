import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { Settings } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Configuración · ACELERAME' }

export default async function ConfiguracionPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Configuración</h1>
        <p className="text-fg-muted mt-1">Datos de tu cuenta y preferencias.</p>
      </div>

      <div className="surface p-6">
        <h2 className="font-serif text-xl font-bold mb-4">Cuenta</h2>
        <div className="space-y-3">
          <Field label="Nombre" value={cliente.nombre_completo} />
          <Field label="Email" value={cliente.email} />
          <Field label="Empresa" value={cliente.empresa ?? '—'} />
          <Field label="Slug" value={cliente.slug} mono />
          <Field label="Estado" value={cliente.estado} />
          <Field label="Modalidad DB" value={cliente.db_modalidad ?? 'no configurada'} />
          <Field label="Schema" value={cliente.schema_db} mono />
        </div>
      </div>

      <div className="surface p-6">
        <h2 className="font-serif text-xl font-bold mb-4">Mensajes y plantillas</h2>
        <p className="text-fg-muted text-sm">
          Editor de plantillas próximamente. Por ahora se editan desde n8n directamente.
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50">
      <span className="text-sm text-fg-muted">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono text-gold' : 'text-fg'}`}>{value}</span>
    </div>
  )
}
