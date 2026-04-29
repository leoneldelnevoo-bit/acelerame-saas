import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import LeadsConfigClient from './LeadsConfigClient'

export const revalidate = 0
export const metadata = { title: 'Fuente de leads · ACELERAME' }

export default async function ConfigLeadsPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()

  // Cargar lead_source_mode actual
  const { data: clienteData } = await admin
    .from('clientes')
    .select('lead_source_mode')
    .eq('id', cliente.id)
    .single()

  // Cargar scraping_config del cliente
  const { data: scrapingTargets } = await admin
    .schema('public')
    .from('scraping_config')
    .select('*')
    .eq('cliente_id', cliente.id)
    .order('tipo', { ascending: true })

  // Cargar imports recientes
  const { data: imports } = await admin
    .from('leads_imports')
    .select('*')
    .eq('cliente_id', cliente.id)
    .order('fecha', { ascending: false })
    .limit(10)

  // Stats: cuántos leads tiene el cliente
  const { count: totalLeads } = await admin
    .schema('public')
    .from('prospeccion_leads')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', cliente.id)

  return (
    <LeadsConfigClient
      clienteId={cliente.id}
      currentMode={clienteData?.lead_source_mode || 'scraping_auto'}
      scrapingTargets={scrapingTargets || []}
      imports={imports || []}
      totalLeads={totalLeads || 0}
    />
  )
}
