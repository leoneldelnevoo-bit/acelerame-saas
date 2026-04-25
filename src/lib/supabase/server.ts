import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase server-side conectado a SCHEMA MASTER.
 * Usa cookies del usuario logueado para auth y RLS.
 */
export async function createMasterServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_ANON_KEY!,
    {
      db: { schema: 'master' },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            )
          } catch {
            // Silently ignore in middleware/RSC
          }
        },
      },
    }
  )
}

/**
 * Cliente Supabase con SERVICE ROLE para schema master.
 * Bypass RLS — usar solo en server components/api routes.
 */
export function createMasterAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_URL!,
    process.env.SUPABASE_MASTER_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'master' },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}

/**
 * Cliente con SERVICE ROLE para acceder al schema PUBLIC del Supabase nuestro
 * (donde están los datos de clientes Managed).
 * Cada cliente Managed tiene su propio schema: cliente_<slug>
 */
export function createManagedClientDB(schemaCliente: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_MASTER_URL!,
    process.env.SUPABASE_MASTER_SERVICE_ROLE_KEY!,
    {
      db: { schema: schemaCliente },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
