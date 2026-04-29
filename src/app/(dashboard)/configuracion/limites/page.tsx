import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import LimitesClient from './LimitesClient'

export const revalidate = 0
export const metadata = { title: 'Límites operativos · ACELERAME' }

export default async function ConfigLimitesPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: limites } = await admin
    .from('cliente_limites')
    .select('*')
    .eq('cliente_id', cliente.id)
    .single()

  return <LimitesClient clienteId={cliente.id} initialLimites={limites} />
}
