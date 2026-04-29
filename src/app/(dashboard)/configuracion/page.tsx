import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { Settings, Users, Mic, Database, Shield, Calendar, Instagram } from 'lucide-react'

export const revalidate = 0
export const metadata = { title: 'Configuración · ACELERAME' }

export default async function ConfiguracionPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const sections = [
    { href: '/configuracion/producto', icon: Settings, title: 'Producto', desc: 'Nombre, propuesta de valor, precio.' },
    { href: '/configuracion/audiencia', icon: Users, title: 'Audiencia', desc: 'Buyer persona, nicho, dolor, objeciones.' },
    { href: '/configuracion/voz', icon: Mic, title: 'Voz e IA', desc: 'Tono, ejemplos, palabras prohibidas.' },
    { href: '/configuracion/leads', icon: Database, title: 'Fuente de leads', desc: 'Scraping automático o traer mi base.' },
    { href: '/configuracion/limites', icon: Shield, title: 'Límites operativos', desc: 'Cuotas anti-ban, horarios.' },
    { href: '/configuracion/agenda', icon: Calendar, title: 'Agenda', desc: 'Link de calendario, duración llamada.' },
    { href: '/configuracion/cuenta-ig', icon: Instagram, title: 'Cuenta Instagram', desc: 'Sesión y configuración de IG.' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Configuración</h1>
        <p className="text-fg-muted mt-1">
          Personalizá cómo el motor trabaja para vos. Cliente: {cliente.nombre_completo}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="surface p-5 hover:border-gold/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <s.icon className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
              <h2 className="font-serif text-lg font-bold">{s.title}</h2>
            </div>
            <p className="text-sm text-fg-muted">{s.desc}</p>
          </Link>
        ))}
      </div>

      <div className="surface p-6 mt-8">
        <h2 className="font-serif text-xl font-bold mb-4">Tu cuenta</h2>
        <div className="space-y-2">
          <Field label="Email" value={cliente.email} />
          <Field label="Slug" value={cliente.slug} mono />
          <Field label="Estado" value={cliente.estado} />
          <Field label="Modalidad DB" value={cliente.db_modalidad ?? 'no configurada'} />
        </div>
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
