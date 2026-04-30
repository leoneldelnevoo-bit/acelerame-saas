import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { rateLimitGuard, auditLog } from '@/lib/security'

/**
 * GET /api/cliente/export
 *
 * Devuelve TODOS los datos del cliente en JSON exportable.
 * Esto es un derecho del cliente: poder llevarse su data si lo desea.
 *
 * Incluye:
 * - Perfil del cliente
 * - Configuración (producto, audiencia, voz, agenda, límites)
 * - Cuentas IG (sin sessionid en plano)
 * - Targets de scraping
 * - Leads completos con conversaciones
 * - Historial de créditos
 * - Audit log
 */
export async function GET(req: NextRequest) {
  const limit = await rateLimitGuard(req, 'export', 5, 3600) // 5 exports por hora
  if (limit) return limit

  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createMasterAdminClient()

  // Recolectar todos los datos del cliente (sin secretos en plano)
  const [
    config,
    limites,
    integraciones,
    cuentasIG,
    targets,
    leads,
    creditos,
    compras,
    auditEntries,
  ] = await Promise.all([
    admin.from('cliente_config').select('*').eq('cliente_id', cliente.id).maybeSingle(),
    admin.from('cliente_limites').select('*').eq('cliente_id', cliente.id).maybeSingle(),
    admin.from('cliente_integraciones').select('agenda_proveedor, agenda_url, agenda_status, byo_anthropic_status, byo_resend_status, byo_resend_from_email').eq('cliente_id', cliente.id).maybeSingle(),
    admin.schema('public').from('instagram_cuentas').select('id, username, tipo, estado, dms_hoy, ultimo_dm, score_min, score_max, created_at').eq('cliente_id', cliente.id),
    admin.schema('public').from('scraping_config').select('*').eq('cliente_id', cliente.id),
    admin.schema('public').from('prospeccion_leads').select('*').eq('cliente_id', cliente.id),
    admin.from('creditos_consumo').select('*').eq('cliente_id', cliente.id).order('fecha', { ascending: false }).limit(5000),
    admin.from('creditos_compras').select('*').eq('cliente_id', cliente.id),
    admin.from('audit_log').select('*').eq('cliente_id', cliente.id).order('fecha', { ascending: false }).limit(1000),
  ])

  const exportData = {
    metadata: {
      exportado_en: new Date().toISOString(),
      cliente: {
        id: cliente.id,
        slug: cliente.slug,
        email: cliente.email,
        nombre: cliente.nombre_completo,
        empresa: cliente.empresa,
      },
      formato_version: '1.0',
      aviso: 'Este export contiene TODOS tus datos en ACELERAME. Las API keys y sessionids NO están incluidos por seguridad.',
    },
    configuracion: {
      producto_y_audiencia: config?.data,
      limites_operacion: limites?.data,
      integraciones_activas: integraciones?.data,
    },
    instagram: cuentasIG?.data ?? [],
    scraping_targets: targets?.data ?? [],
    leads_completos: leads?.data ?? [],
    historial_creditos: creditos?.data ?? [],
    historial_compras: compras?.data ?? [],
    audit_log: auditEntries?.data ?? [],
  }

  await auditLog(cliente.id, 'export_solicitado', { total_leads: leads?.data?.length ?? 0 }, req)

  // Devolver como descarga JSON
  const filename = `acelerame-export-${cliente.slug}-${new Date().toISOString().split('T')[0]}.json`
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
