import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createMasterServerClient, createMasterAdminClient, createManagedClientDB } from './supabase/server'

/**
 * Tipo de cliente con info completa
 */
export type ClienteContext = {
  id: string
  slug: string
  nombre_completo: string
  email: string
  empresa: string | null
  estado: string
  es_founder: boolean
  motor_activo: boolean
  db_modalidad: 'byodb' | 'managed' | null
  lead_source_mode: 'scraping_auto' | 'byol' | 'mixed' | null
  supabase_url: string | null
  supabase_anon_key: string | null
  supabase_project_id: string | null
  schema_db: string | null
  supabase_test_status: string | null
  onboarding_completado: boolean
  onboarding_paso: number
  saldo?: {
    creditos_actuales: number
    creditos_comprados_total: number
    creditos_gastados_total: number
  } | null
}

export async function getClienteContext(): Promise<ClienteContext | null> {
  const supabase = await createMasterServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const admin = createMasterAdminClient()

  const { data: cliente, error } = await admin
    .from('clientes')
    .select(`
      id, slug, nombre_completo, email, empresa, estado, es_founder,
      motor_activo, db_modalidad, lead_source_mode,
      supabase_url, supabase_anon_key, supabase_project_id, schema_db,
      supabase_test_status,
      onboarding_completado, onboarding_paso
    `)
    .eq('email', user.email)
    .maybeSingle()

  if (error || !cliente) return null

  const { data: saldo } = await admin
    .from('creditos_saldo')
    .select('creditos_actuales, creditos_comprados_total, creditos_gastados_total')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  return {
    ...cliente,
    saldo: saldo ?? null,
  } as ClienteContext
}

export function clienteTieneDB(cliente: ClienteContext): boolean {
  if (cliente.db_modalidad === 'byodb') {
    return !!(cliente.supabase_url && cliente.supabase_anon_key && cliente.supabase_test_status === 'ok')
  }
  return cliente.db_modalidad === 'managed'
}

/**
 * Crea cliente Supabase para acceder a los datos del cliente.
 * - BYODB: usa el Supabase del cliente (schema public)
 * - Managed: usa nuestro Supabase con schema 'public' (filtros por cliente_id)
 *
 * IMPORTANTE: Para Managed siempre devolvemos un cliente apuntando a 'public',
 * ya que los datos viven en public.X con cliente_id (NO en cliente_<slug>.X).
 */
export function createClienteSupabase(cliente: ClienteContext): SupabaseClient | null {
  if (!clienteTieneDB(cliente)) return null

  if (cliente.db_modalidad === 'byodb') {
    if (!cliente.supabase_url || !cliente.supabase_anon_key) return null
    return createClient(cliente.supabase_url, cliente.supabase_anon_key, {
      db: { schema: 'public' },
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  // Managed: usar createManagedClientDB con schema 'public' (no cliente_<slug>)
  return createManagedClientDB('public') as unknown as SupabaseClient
}

/**
 * Helper: aplica filtro cliente_id solo en modalidad Managed.
 */
function filtrarPorCliente(query: any, cliente: ClienteContext) {
  return cliente.db_modalidad === 'managed' ? query.eq('cliente_id', cliente.id) : query
}

export async function getClienteMetricas(cliente: ClienteContext) {
  const db = createClienteSupabase(cliente)
  if (!db) return null

  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyIso = hoy.toISOString()

    const [
      totalRes,
      sinContactarRes,
      contactadosHoyRes,
      respondieronRes,
      agendadosRes,
      cuentasIGRes,
    ] = await Promise.all([
      filtrarPorCliente(db.from('prospeccion_leads').select('*', { count: 'exact', head: true }), cliente),
      filtrarPorCliente(db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 0), cliente),
      filtrarPorCliente(db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).gte('etapa', 1).gte('ultimo_contacto', hoyIso), cliente),
      filtrarPorCliente(db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).in('etapa', [2, 4, 6, 8, 10]), cliente),
      filtrarPorCliente(db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 12), cliente),
      filtrarPorCliente(db.from('instagram_cuentas').select('*', { count: 'exact', head: true }), cliente),
    ])

    return {
      total: totalRes.count ?? 0,
      sin_contactar: sinContactarRes.count ?? 0,
      contactados_hoy: contactadosHoyRes.count ?? 0,
      respondieron: respondieronRes.count ?? 0,
      agendados: agendadosRes.count ?? 0,
      cuentas_ig: cuentasIGRes.count ?? 0,
    }
  } catch (e) {
    console.error('Error fetching metricas:', e)
    return null
  }
}

export async function listarConversaciones(cliente: ClienteContext, limit: number = 50) {
  const db = createClienteSupabase(cliente)
  if (!db) return []

  let query = db
    .from('prospeccion_leads')
    .select('handle, nombre, score, etapa, respuesta_lead, historial_conversacion, fecha_ultima_respuesta, ultimo_contacto')
    .in('etapa', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .order('fecha_ultima_respuesta', { ascending: false, nullsFirst: false })
    .order('etapa', { ascending: false })
    .limit(limit)

  query = filtrarPorCliente(query, cliente)

  const { data, error } = await query
  if (error) {
    console.error('listarConversaciones error:', error)
    return []
  }
  return data ?? []
}

export async function listarAgendados(cliente: ClienteContext, limit: number = 20) {
  const db = createClienteSupabase(cliente)
  if (!db) return []

  let query = db
    .from('prospeccion_leads')
    .select('handle, nombre, score, etapa, respuesta_lead, historial_conversacion, fecha_ultima_respuesta, ultimo_contacto')
    .eq('etapa', 12)
    .order('ultimo_contacto', { ascending: false, nullsFirst: false })
    .limit(limit)

  query = filtrarPorCliente(query, cliente)

  const { data, error } = await query
  if (error) {
    console.error('listarAgendados error:', error)
    return []
  }
  return data ?? []
}

export async function listarCuentasIG(cliente: ClienteContext) {
  const db = createClienteSupabase(cliente)
  if (!db) return []

  let query = db
    .from('instagram_cuentas')
    .select('id, username, tipo, estado, sessionid, dms_hoy, ultimo_dm, score_min, score_max, created_at')
    .order('tipo', { ascending: true })

  query = filtrarPorCliente(query, cliente)

  const { data, error } = await query
  if (error) {
    console.error('listarCuentasIG error:', error)
    return []
  }
  return data ?? []
}

export async function listarScrapingConfig(cliente: ClienteContext) {
  const db = createClienteSupabase(cliente)
  if (!db) return []

  let query = db
    .from('scraping_config')
    .select('id, tipo, valor, activo, ultimo_scrape, leads_encontrados, created_at')
    .order('tipo', { ascending: true })

  query = filtrarPorCliente(query, cliente)

  const { data, error } = await query
  if (error) {
    console.error('listarScrapingConfig error:', error)
    return []
  }
  return data ?? []
}
