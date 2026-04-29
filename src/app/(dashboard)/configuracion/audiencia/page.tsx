import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import AudienciaForm from './AudienciaForm'

export const revalidate = 0
export const metadata = { title: 'Audiencia · ACELERAME' }

export default async function AudienciaPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: config } = await admin
    .from('cliente_config')
    .select('buyer_persona_descripcion, buyer_persona_nicho, buyer_persona_dolor_principal, buyer_persona_objeciones_comunes, calificacion_criterio, descalificacion_criterio')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  return <AudienciaForm initialConfig={config} />
}
