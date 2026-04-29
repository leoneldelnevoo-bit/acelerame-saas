import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import AgendaForm from './AgendaForm'

export const revalidate = 0
export const metadata = { title: 'Agenda · ACELERAME' }

export default async function AgendaPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: config } = await admin
    .from('cliente_config')
    .select('link_agenda, duracion_llamada_min')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  return <AgendaForm initialConfig={config} />
}
