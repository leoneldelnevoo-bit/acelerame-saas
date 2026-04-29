import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import CuentaIGClient from './CuentaIGClient'

export const revalidate = 0
export const metadata = { title: 'Cuenta Instagram · ACELERAME' }

export default async function CuentaIGPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: cuentas } = await admin
    .schema('public')
    .from('instagram_cuentas')
    .select('id, username, tipo, estado, sessionid, dms_hoy, ultimo_dm, score_min, score_max')
    .eq('cliente_id', cliente.id)
    .order('tipo', { ascending: true })

  return <CuentaIGClient clienteId={cliente.id} cuentas={cuentas || []} />
}
