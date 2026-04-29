import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tipo, valor } = await req.json()
  const tiposValidos = ['hashtag', 'keyword', 'cuenta_seguidores', 'cuenta_comentarios', 'cuenta_likers', 'ubicacion']
  if (!tiposValidos.includes(tipo) || !valor?.trim()) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const admin = createMasterAdminClient()
  const { error } = await admin
    .schema('public')
    .from('scraping_config')
    .insert({
      cliente_id: cliente.id,
      tipo,
      valor: valor.trim().toLowerCase(),
      activo: true,
      publico: 'plataforma',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
