import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import VozForm from './VozForm'

export const revalidate = 0
export const metadata = { title: 'Voz e IA · ACELERAME' }

export default async function VozPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: config } = await admin
    .from('cliente_config')
    .select('tono, idioma, region, palabras_prohibidas, ejemplos_mensajes')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  return <VozForm initialConfig={config} />
}
