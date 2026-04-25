import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext } from '@/lib/cliente-db'
import { formatNumber } from '@/lib/utils'
import {
  Zap, LayoutDashboard, Users, MessageSquare, Inbox, Plug, Settings,
  CreditCard, LogOut, Crown, DollarSign, Sparkles
} from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  // Si el cliente no completó onboarding y no es founder, redirigir a wizard
  if (!cliente.onboarding_completado && !cliente.es_founder) {
    redirect('/bienvenida')
  }

  const isAdmin = cliente.email === 'leoneldelnevoo@gmail.com'

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-bg-surface flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold to-gold-hover flex items-center justify-center shadow-gold">
              <Zap className="w-5 h-5 text-bg-base" />
            </div>
            <span className="font-serif text-xl font-bold">
              ACELER<span className="text-gold">AME</span>
            </span>
          </Link>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-medium truncate">{cliente.nombre_completo}</p>
          <p className="text-xs text-fg-subtle truncate">{cliente.empresa ?? cliente.email}</p>
          {cliente.es_founder && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs">
              <Crown className="w-3 h-3" />
              Founder
            </span>
          )}
        </div>

        {/* Saldo */}
        <div className="px-6 py-4 border-b border-border">
          <p className="text-xs text-fg-subtle uppercase tracking-wider mb-1">Saldo</p>
          <p className="font-serif text-2xl font-bold text-gold">
            {formatNumber(cliente.saldo?.creditos_actuales ?? 0)}
            <span className="text-xs text-fg-muted font-sans ml-1">cr</span>
          </p>
          <Link href="/recargar" className="block mt-2 text-xs text-gold hover:text-gold-hover">
            + Recargar →
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
          <NavLink href="/leads" icon={Users}>Leads</NavLink>
          <NavLink href="/bandeja" icon={Inbox}>Bandeja</NavLink>
          <NavLink href="/campanas" icon={Sparkles}>Campañas</NavLink>
          <NavLink href="/integraciones" icon={Plug}>Integraciones</NavLink>
          <NavLink href="/creditos" icon={CreditCard}>Créditos</NavLink>
          <NavLink href="/configuracion" icon={Settings}>Configuración</NavLink>

          {isAdmin && (
            <>
              <div className="px-3 py-2 mt-6 border-t border-border">
                <p className="text-xs text-gold uppercase tracking-wider">Admin</p>
              </div>
              <NavLink href="/admin/clientes" icon={Users}>Clientes</NavLink>
              <NavLink href="/admin/ingresos" icon={DollarSign}>Ingresos</NavLink>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="btn-ghost w-full justify-start">
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-fg-muted hover:text-fg hover:bg-bg-overlay transition-colors text-sm"
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  )
}
