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
  rol: 'admin' | 'admin_cliente' | 'cliente' | null
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
      id, slug, nombre_completo, email, empresa, estado, es_founder, rol,
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
 * Crea cliente Supabase para BYODB (apunta al Supabase del usuario).
 * Para Managed, NO usar este — usar las funciones master.* via RPC.
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

  // Para managed retornamos null acá; los callers usan RPCs.
  return null
}

/**
 * Métricas del cliente (leads, cuentas, etc).
 * Para BYODB: query directo al Supabase del cliente
 * Para Managed: RPC a master.contar_leads(schema)
 */
export async function getClienteMetricas(cliente: ClienteContext) {
  if (!clienteTieneDB(cliente)) return null

  // Caso BYODB: query directo
  if (cliente.db_modalidad === 'byodb') {
    const db = createClienteSupabase(cliente)
    if (!db) return null
    try {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const hoyIso = hoy.toISOString()
      const [t, sc, ch, r, a, ig] = await Promise.all([
        db.from('prospeccion_leads').select('*', { count: 'exact', head: true }),
        db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 0),
        db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).gte('etapa', 1).gte('ultimo_contacto', hoyIso),
        db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).in('etapa', [2, 4, 6, 8, 10]),
        db.from('prospeccion_leads').select('*', { count: 'exact', head: true }).eq('etapa', 12),
        db.from('instagram_cuentas').select('*', { count: 'exact', head: true }),
      ])
      return {
        total: t.count ?? 0,
        sin_contactar: sc.count ?? 0,
        contactados_hoy: ch.count ?? 0,
        respondieron: r.count ?? 0,
        agendados: a.count ?? 0,
        cuentas_ig: ig.count ?? 0,
      }
    } catch (e) {
      console.error('Error metricas BYODB:', e)
      return { total: 0, sin_contactar: 0, contactados_hoy: 0, respondieron: 0, agendados: 0, cuentas_ig: 0 }
    }
  }

  // Caso Managed: RPC
  if (cliente.db_modalidad === 'managed') {
    const admin = createMasterAdminClient()
    const { data, error } = await admin.rpc('contar_leads', { p_schema: cliente.schema_db })
    if (error || !data) {
      console.error('Error RPC contar_leads:', error)
      return { total: 0, sin_contactar: 0, contactados_hoy: 0, respondieron: 0, agendados: 0, cuentas_ig: 0 }
    }
    return data as {
      total: number
      sin_contactar: number
      contactados_hoy: number
      respondieron: number
      agendados: number
      cuentas_ig: number
    }
  }

  return null
}

/**
 * Listar leads paginados
 */
export async function listarLeads(cliente: ClienteContext, opts: { etapa?: number; limit?: number; offset?: number } = {}) {
  if (!clienteTieneDB(cliente)) return []
  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0

  if (cliente.db_modalidad === 'byodb') {
    const db = createClienteSupabase(cliente)
    if (!db) return []
    let q = db.from('prospeccion_leads').select('*').order('score', { ascending: false, nullsFirst: false }).range(offset, offset + limit - 1)
    if (typeof opts.etapa === 'number') q = q.eq('etapa', opts.etapa)
    const { data } = await q
    return data ?? []
  }

  const admin = createMasterAdminClient()
  const { data } = await admin.rpc('listar_leads', {
    p_schema: cliente.schema_db,
    p_etapa: opts.etapa ?? null,
    p_limit: limit,
    p_offset: offset,
  })
  return Array.isArray(data) ? data : []
}

/**
 * Listar cuentas IG del cliente
 */
export async function listarCuentasIG(cliente: ClienteContext) {
  if (!clienteTieneDB(cliente)) return []

  if (cliente.db_modalidad === 'byodb') {
    const db = createClienteSupabase(cliente)
    if (!db) return []
    const { data } = await db.from('instagram_cuentas').select('id, username, estado, mensajes_total')
    return data ?? []
  }

  const admin = createMasterAdminClient()
  const { data } = await admin.rpc('listar_cuentas_ig', { p_schema: cliente.schema_db })
  return Array.isArray(data) ? data : []
}

/**
 * Listar config de scraping del cliente
 */
export async function listarScrapingConfig(cliente: ClienteContext) {
  if (!clienteTieneDB(cliente)) return []

  if (cliente.db_modalidad === 'byodb') {
    const db = createClienteSupabase(cliente)
    if (!db) return []
    const { data } = await db.from('scraping_config').select('*').eq('activo', true).order('created_at', { ascending: false })
    return data ?? []
  }

  const admin = createMasterAdminClient()
  const { data } = await admin.rpc('listar_scraping_config', { p_schema: cliente.schema_db })
  return Array.isArray(data) ? data : []
}

/**
 * Listar conversaciones activas (etapas 2,4,6,8,10)
 */
export async function listarConversaciones(cliente: ClienteContext, limit = 50): Promise<any[]> {
  if (!clienteTieneDB(cliente)) return []

  if (cliente.db_modalidad === 'byodb') {
    const db = createClienteSupabase(cliente)
    if (!db) return []
    const { data } = await db.from('prospeccion_leads')
      .select('handle,nombre,etapa,respuesta_lead,historial_conversacion,fecha_ultima_respuesta,score')
      .in('etapa', [2, 4, 6, 8, 10])
      .order('fecha_ultima_respuesta', { ascending: false, nullsFirst: false })
      .limit(limit)
    return data ?? []
  }

  const admin = createMasterAdminClient()
  const { data } = await admin.rpc('listar_conversaciones', { p_schema: cliente.schema_db, p_limit: limit })
  return Array.isArray(data) ? data : []
}

/**
 * Listar agendados (etapa 12)
 */
export async function listarAgendados(cliente: ClienteContext, limit = 20): Promise<any[]> {
  if (!clienteTieneDB(cliente)) return []

  if (cliente.db_modalidad === 'byodb') {
    const db = createClienteSupabase(cliente)
    if (!db) return []
    const { data } = await db.from('prospeccion_leads')
      .select('handle,nombre,respuesta_lead,fecha_ultima_respuesta,score')
      .eq('etapa', 12)
      .order('fecha_ultima_respuesta', { ascending: false, nullsFirst: false })
      .limit(limit)
    return data ?? []
  }

  const admin = createMasterAdminClient()
  const { data } = await admin.rpc('listar_agendados', { p_schema: cliente.schema_db, p_limit: limit })
  return Array.isArray(data) ? data : []
}
