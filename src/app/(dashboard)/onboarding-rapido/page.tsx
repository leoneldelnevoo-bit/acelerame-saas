import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import OnboardingWizard from './OnboardingWizard'

export const revalidate = 0
export const metadata = { title: 'Empezá en 5 minutos · ACELERAME' }

export default async function OnboardingRapidoPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const [{ data: config }, { data: integ }, { count: cuentasIG }, { count: targets }] = await Promise.all([
    admin.from('cliente_config').select('producto_nombre, buyer_persona_descripcion').eq('cliente_id', cliente.id).maybeSingle(),
    admin.from('cliente_integraciones').select('agenda_status').eq('cliente_id', cliente.id).maybeSingle(),
    admin.schema('public').from('instagram_cuentas').select('*', { count: 'exact', head: true }).eq('cliente_id', cliente.id).eq('estado', 'activa'),
    admin.schema('public').from('scraping_config').select('*', { count: 'exact', head: true }).eq('cliente_id', cliente.id).eq('activo', true),
  ])

  const progreso = {
    producto: !!config?.producto_nombre,
    audiencia: !!config?.buyer_persona_descripcion,
    cuentaIG: (cuentasIG ?? 0) > 0,
    targets: (targets ?? 0) > 0,
    agenda: integ?.agenda_status === 'ok',
  }

  return <OnboardingWizard cliente={cliente} progreso={progreso} />
}
