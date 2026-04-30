import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import ImportClient from './ImportClient'

export const revalidate = 0
export const metadata = { title: 'Importar leads · ACELERAME' }

export default async function ImportarPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  // Últimos 5 imports del cliente
  const admin = createMasterAdminClient()
  const { data: imports } = await admin
    .from('leads_imports')
    .select('id, fecha, source_type, filename, total_filas, procesados, fallados, status')
    .eq('cliente_id', cliente.id)
    .order('fecha', { ascending: false })
    .limit(5)

  return <ImportClient imports={imports || []} />
}
