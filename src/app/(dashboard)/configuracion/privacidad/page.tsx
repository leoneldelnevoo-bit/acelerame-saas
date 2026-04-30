import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import PrivacidadClient from './PrivacidadClient'

export const revalidate = 0
export const metadata = { title: 'Privacidad y datos · ACELERAME' }

export default async function PrivacidadPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const [{ count: leads }, { count: conv }, { data: audit }] = await Promise.all([
    admin.schema('public').from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('cliente_id', cliente.id),
    admin.schema('public').from('prospeccion_mensajes').select('*', { count: 'exact', head: true }).eq('cliente_id', cliente.id),
    admin.from('audit_log').select('id, accion, fecha, ip_address').eq('cliente_id', cliente.id).order('fecha', { ascending: false }).limit(20),
  ])

  return <PrivacidadClient
    cliente={cliente}
    stats={{ leads: leads ?? 0, conversaciones: conv ?? 0 }}
    auditPreview={audit ?? []}
  />
}
