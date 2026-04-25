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
  // Modalidad de DB
  db_modalidad: 'byodb' | 'managed' | null
  // Para BYODB
  supabase_url: string | null
  supabase_anon_key: string | null
  supabase_project_id: string | null
  // Para Managed (DB nuestra)
  schema_db: string  // 'cliente_<slug>' para managed, 'public' para byodb
  supabase_test_status: string | null
  // Onboarding
  onboarding_completado: boolean
  onboarding_paso: number
  // Saldos
  saldo?: {
    creditos_actuales: number
    creditos_comprados_total: number
    creditos_gastados_total: number
  } | null
}

/**
 * Obtiene el contexto completo del cliente logueado.
 * Returns null si no hay sesión.
 */
export async function getClienteContext(): Promise<ClienteContext | null> {
  const supabase = await createMasterServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const admin = createMasterAdminClient()

  const { data: cliente, error } = await admin
    .from('clientes')
    .select(`
      id, slug, nombre_completo, email, empresa, estado, es_founder,
      motor_activo, db_modalidad,
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

/**
 * Verifica si el cliente tiene una DB lista para usar (BYODB o Managed con schema creado)
 */
export function clienteTieneDB(cliente: ClienteContext): boolean {
  if (cliente.db_modalidad === 'byodb') {
    return !!(cliente.supabase_url && cliente.supabase_anon_key && cliente.supabase_test_status === 'ok')
  }
  if (cliente.db_modalidad === 'managed') {
    return !!cliente.schema_db && cliente.supabase_test_status === 'ok'
  }
  return false
}

/**
 * Crea el cliente Supabase para acceder a los datos del cliente.
 * - BYODB: usa el Supabase del cliente
 * - Managed: usa nuestro Supabase con su schema
 *
 * Returns 'any' para evitar conflictos de tipos del schema dinámico.
 */
export function createClienteSupabase(cliente: ClienteContext): any {
  if (!clienteTieneDB(cliente)) return null

  if (cliente.db_modalidad === 'byodb') {
    if (!cliente.supabase_url || !cliente.supabase_anon_key) return null
    return createClient(cliente.supabase_url, cliente.supabase_anon_key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  if (cliente.db_modalidad === 'managed') {
    return createManagedClientDB(cliente.schema_db)
  }

  return null
}

/**
 * Métricas estandarizadas que se muestran en dashboard.
 * Funciona igual para BYODB y Managed porque ambos tienen el mismo esquema.
 */
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
      db.from('prospeccion_leads').select('*', { count: 'exact', head: true }),
      db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 0),
      db.from('prospeccion_leads').select('*', { count: 'exact', head: true })
        .gte('etapa', 1).gte('ultimo_contacto', hoyIso),
      db.from('prospeccion_leads').select('*', { count: 'exact', head: true })
        .in('etapa', [2, 4, 6, 8, 10]),
      db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 12),
      db.from('instagram_cuentas').select('*', { count: 'exact', head: true }),
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
