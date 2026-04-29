import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createMasterServerClient, createMasterAdminClient } from './supabase/server'

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
  // Fuente de leads
  lead_source_mode: 'scraping_auto' | 'byol' | 'mixed' | null
  // Para BYODB
  supabase_url: string | null
  supabase_anon_key: string | null
  supabase_project_id: string | null
  // Para Managed (DB nuestra)
  schema_db: string | null
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

/**
 * Verifica si el cliente tiene una DB lista para usar.
 * - Managed: SIEMPRE listo (todos los clientes managed comparten public.X con cliente_id)
 * - BYODB: requiere supabase_url + key + test_status='ok'
 */
export function clienteTieneDB(cliente: ClienteContext): boolean {
  if (cliente.db_modalidad === 'byodb') {
    return !!(cliente.supabase_url && cliente.supabase_anon_key && cliente.supabase_test_status === 'ok')
  }
  // Managed: siempre OK porque usamos public con cliente_id
  return cliente.db_modalidad === 'managed'
}

/**
 * Crea cliente Supabase para acceder a los datos del cliente.
 * - BYODB: usa el Supabase del cliente (schema public)
 * - Managed: usa nuestro Supabase (schema public con filtros por cliente_id)
 *
 * IMPORTANTE: Quien use este cliente DEBE filtrar por cliente_id en cada query.
 * Use queryDB() helper que hace el filtro automáticamente.
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

  // Managed: usa el admin client (acceso completo, pero filtramos por cliente_id manualmente)
  return createMasterAdminClient() as unknown as SupabaseClient
}

/**
 * Helper que devuelve un query builder ya filtrado por cliente_id (para Managed)
 * o sin filtro (para BYODB, donde el cliente tiene su propio Supabase)
 */
export function queryDB<T = any>(cliente: ClienteContext, table: string) {
  const db = createClienteSupabase(cliente)
  if (!db) return null

  // BYODB: el Supabase es del cliente, no se filtra (es todo suyo)
  if (cliente.db_modalidad === 'byodb') {
    return db.from(table)
  }

  // Managed: filtrar por cliente_id
  return {
    select: (cols?: string, opts?: any) => db.from(table).select(cols || '*', opts).eq('cliente_id', cliente.id),
    insert: (rows: any) => {
      const withClienteId = Array.isArray(rows)
        ? rows.map((r) => ({ ...r, cliente_id: cliente.id }))
        : { ...rows, cliente_id: cliente.id }
      return db.from(table).insert(withClienteId)
    },
    update: (changes: any) => db.from(table).update(changes).eq('cliente_id', cliente.id),
    delete: () => db.from(table).delete().eq('cliente_id', cliente.id),
    upsert: (rows: any, opts?: any) => {
      const withClienteId = Array.isArray(rows)
        ? rows.map((r) => ({ ...r, cliente_id: cliente.id }))
        : { ...rows, cliente_id: cliente.id }
      return db.from(table).upsert(withClienteId, opts)
    },
  }
}

/**
 * Métricas estandarizadas que se muestran en dashboard.
 * Funciona para BYODB y Managed.
 */
export async function getClienteMetricas(cliente: ClienteContext) {
  const db = createClienteSupabase(cliente)
  if (!db) return null

  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyIso = hoy.toISOString()

    // Helper que aplica filtro cliente_id solo si es Managed
    const filtrar = (q: any) => cliente.db_modalidad === 'managed' ? q.eq('cliente_id', cliente.id) : q

    const [
      totalRes,
      sinContactarRes,
      contactadosHoyRes,
      respondieronRes,
      agendadosRes,
      cuentasIGRes,
    ] = await Promise.all([
      filtrar(db.from('prospeccion_leads').select('*', { count: 'exact', head: true })),
      filtrar(db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 0)),
      filtrar(db.from('prospeccion_leads').select('*', { count: 'exact', head: true })
        .gte('etapa', 1).gte('ultimo_contacto', hoyIso)),
      filtrar(db.from('prospeccion_leads').select('*', { count: 'exact', head: true })
        .in('etapa', [2, 4, 6, 8, 10])),
      filtrar(db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 12)),
      filtrar(db.from('instagram_cuentas').select('*', { count: 'exact', head: true })),
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
