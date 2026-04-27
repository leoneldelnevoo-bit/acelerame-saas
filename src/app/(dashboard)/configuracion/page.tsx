import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { Settings, User, Sparkles, Target, Mic } from 'lucide-react'
import { ConfigTabs } from './tabs'

export const revalidate = 0
export const metadata = { title: 'Configuración · ACELERAME' }

export default async function ConfiguracionPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  // Cargar config existente del cliente (puede no existir todavía)
  const admin = createMasterAdminClient()
  const { data: configExistente } = await admin
    .from('cliente_config')
    .select('*')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-gold" />
          Configuración
        </h1>
        <p className="text-fg-muted mt-1">
          Personalizá cómo la IA te representa cuando habla con tus leads.
        </p>
      </div>

      <ConfigTabs cliente={cliente} configInicial={configExistente} />
    </div>
  )
}
