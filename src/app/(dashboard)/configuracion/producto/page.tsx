import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import ProductoForm from './ProductoForm'

export const revalidate = 0
export const metadata = { title: 'Producto · ACELERAME' }

export default async function ProductoPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: config } = await admin
    .from('cliente_config')
    .select('producto_nombre, producto_descripcion, producto_propuesta_valor, producto_precio_rango')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  return <ProductoForm initialConfig={config} />
}
