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
  const [{ data: config }, { data: integ }] = await Promise.all([
    admin
      .from('cliente_config')
      .select('duracion_llamada_min')
      .eq('cliente_id', cliente.id)
      .maybeSingle(),
    admin
      .from('cliente_integraciones')
      .select('agenda_proveedor, agenda_url, agenda_status, agenda_validado_en')
      .eq('cliente_id', cliente.id)
      .maybeSingle(),
  ])

  return (
    <AgendaForm
      initial={{
        duracion: config?.duracion_llamada_min ?? 20,
        proveedor: integ?.agenda_proveedor ?? null,
        url: integ?.agenda_url ?? '',
        status: integ?.agenda_status ?? 'pendiente',
        validadoEn: integ?.agenda_validado_en ?? null,
      }}
    />
  )
}
