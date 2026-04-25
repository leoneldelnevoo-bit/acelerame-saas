import { createMasterAdminClient } from '../supabase/server'
import { clienteSchemaName } from '../utils'

/**
 * Setup completo de un cliente Managed:
 * 1. Crea su schema en nuestro Supabase
 * 2. Crea las tablas necesarias (prospeccion_leads, instagram_cuentas, scraping_config)
 * 3. Actualiza master.clientes con db_modalidad='managed' y schema_db
 *
 * Esto se ejecuta vía RPC en Postgres porque crear schemas requiere permisos especiales.
 * La función SQL `master.crear_schema_cliente()` está en sql/01_master_schema.sql
 */
export async function setupClienteManaged(clienteId: string, slug: string): Promise<{
  success: boolean
  schema?: string
  error?: string
}> {
  const admin = createMasterAdminClient()
  const schemaName = clienteSchemaName(slug)

  // Llamar a la función SQL que crea schema + tablas
  const { data, error } = await admin.rpc('crear_schema_cliente', {
    p_cliente_id: clienteId,
    p_schema_name: schemaName,
  })

  if (error) {
    console.error('Error creando schema:', error)
    return { success: false, error: error.message }
  }

  return { success: true, schema: schemaName }
}
