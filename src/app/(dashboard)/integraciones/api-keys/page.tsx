import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { maskKey } from '@/lib/security'
import ApiKeysForm from './ApiKeysForm'

export const revalidate = 0
export const metadata = { title: 'API Keys · ACELERAME' }

export default async function ApiKeysPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')

  const admin = createMasterAdminClient()
  const { data: integ } = await admin
    .from('cliente_integraciones')
    .select('byo_anthropic_key, byo_anthropic_status, byo_anthropic_validado_en, byo_resend_key, byo_resend_from_email, byo_resend_status, byo_resend_validado_en')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  return (
    <ApiKeysForm
      initial={{
        anthropic: {
          masked: maskKey(integ?.byo_anthropic_key),
          configurada: !!integ?.byo_anthropic_key,
          status: integ?.byo_anthropic_status ?? 'no_configurado',
          validadoEn: integ?.byo_anthropic_validado_en ?? null,
        },
        resend: {
          masked: maskKey(integ?.byo_resend_key),
          configurada: !!integ?.byo_resend_key,
          fromEmail: integ?.byo_resend_from_email ?? '',
          status: integ?.byo_resend_status ?? 'no_configurado',
          validadoEn: integ?.byo_resend_validado_en ?? null,
        },
      }}
    />
  )
}
